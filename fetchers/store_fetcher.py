from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict
from html import unescape
from typing import Dict, List, Optional, Tuple

from utils.models import StoreRecord

LOGGER = logging.getLogger(__name__)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)


class StoreFetcher:
    def __init__(self, timeout: int = 20, retries: int = 3, retry_backoff_s: float = 1.5):
        self.timeout = timeout
        self.retries = retries
        self.retry_backoff_s = retry_backoff_s

    def fetch(self, game_name: str, url: str) -> Tuple[Optional[StoreRecord], Dict]:
        if "play.google.com" in url:
            return self._fetch_google_play(game_name, url)
        if "apps.apple.com" in url:
            return self._fetch_app_store(game_name, url)
        LOGGER.warning("Unsupported URL: %s", url)
        return None, self._evidence_shell(game_name, url, "unsupported")

    def _request(self, url: str) -> Optional[str]:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        for attempt in range(1, self.retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as response:  # noqa: S310
                    return response.read().decode("utf-8", errors="ignore")
            except (urllib.error.URLError, TimeoutError, ValueError) as exc:
                LOGGER.warning("Request failed %s (attempt %s/%s): %s", url, attempt, self.retries, exc)
                time.sleep(self.retry_backoff_s * attempt)
        return None

    def _fetch_google_play(self, game_name: str, url: str) -> Tuple[Optional[StoreRecord], Dict]:
        html = self._request(url)
        if not html:
            return None, self._evidence_shell(game_name, url, "fetch_failed")

        title = self._meta_content(html, "og:title")
        description = self._meta_content(html, "og:description")
        json_ld = self._extract_json_ld(html)

        record = StoreRecord(game_input_name=game_name, source_url=url, platform="google_play", title=title, description=description)
        self._fill_from_jsonld(record, json_ld, image_key="image")

        text_blob = self._html_to_text(html)
        record.has_iap = bool(re.search(r"In-app purchases", text_blob, re.IGNORECASE))
        record.has_ads = bool(re.search(r"Contains ads", text_blob, re.IGNORECASE))
        record.update_date = self._find_after_label(text_blob, ["Updated on", "Updated"])
        record.release_date = self._find_after_label(text_blob, ["Released on", "Release date"])
        record.languages = self._extract_languages(text_blob)
        record.tags = self._extract_tags(text_blob)
        if not record.screenshots:
            record.screenshots = self._extract_image_urls(html)

        return record, self._build_evidence(record, html)

    def _fetch_app_store(self, game_name: str, url: str) -> Tuple[Optional[StoreRecord], Dict]:
        html = self._request(url)
        if not html:
            return None, self._evidence_shell(game_name, url, "fetch_failed")

        title = self._meta_content(html, "og:title")
        description = self._meta_content(html, "og:description")
        json_ld = self._extract_json_ld(html)

        record = StoreRecord(game_input_name=game_name, source_url=url, platform="app_store", title=title, description=description)
        self._fill_from_jsonld(record, json_ld, image_key="screenshot")

        text_blob = self._html_to_text(html)
        record.has_iap = bool(re.search(r"In-App Purchases", text_blob, re.IGNORECASE))
        record.has_ads = bool(re.search(r"advertising", text_blob, re.IGNORECASE))
        record.release_date = self._find_after_label(text_blob, ["Released", "Release Date"])
        record.update_date = self._find_after_label(text_blob, ["Version History", "Updated"])
        record.languages = self._extract_languages(text_blob)
        record.tags = self._extract_tags(text_blob)
        if not record.screenshots:
            record.screenshots = self._extract_image_urls(html)

        return record, self._build_evidence(record, html)

    def _fill_from_jsonld(self, record: StoreRecord, json_ld: Optional[Dict], image_key: str) -> None:
        if not json_ld:
            return
        record.publisher = self._nested_get(json_ld, ["author", "name"])
        record.rating = self._safe_float(self._nested_get(json_ld, ["aggregateRating", "ratingValue"]))
        record.rating_count = self._safe_int(self._nested_get(json_ld, ["aggregateRating", "ratingCount"]))
        record.price_range = self._nested_get(json_ld, ["offers", "price"]) or "Free"
        genre = json_ld.get("applicationCategory") if isinstance(json_ld, dict) else None
        if genre:
            record.categories = [genre]
        images = json_ld.get(image_key) if isinstance(json_ld, dict) else []
        if isinstance(images, list):
            record.screenshots = images[:10]
        elif isinstance(images, str):
            record.screenshots = [images]

    @staticmethod
    def _meta_content(html: str, property_name: str) -> Optional[str]:
        m = re.search(
            rf'<meta[^>]+property=["\']{re.escape(property_name)}["\'][^>]+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        return unescape(m.group(1)) if m else None

    @staticmethod
    def _extract_json_ld(html: str) -> Optional[Dict]:
        blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, flags=re.IGNORECASE | re.DOTALL)
        for block in blocks:
            try:
                payload = json.loads(block.strip())
                if isinstance(payload, list):
                    for item in payload:
                        if isinstance(item, dict) and item.get("@type") in {"SoftwareApplication", "MobileApplication"}:
                            return item
                if isinstance(payload, dict) and payload.get("@type") in {"SoftwareApplication", "MobileApplication"}:
                    return payload
            except Exception:  # noqa: BLE001
                continue
        return None

    @staticmethod
    def _html_to_text(html: str) -> str:
        html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
        html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s+", " ", unescape(text)).strip()

    @staticmethod
    def _find_after_label(text: str, labels: List[str]) -> Optional[str]:
        for label in labels:
            match = re.search(rf"{re.escape(label)}\s*([A-Za-z0-9,./\- ]{{4,40}})", text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    @staticmethod
    def _extract_languages(text: str) -> List[str]:
        match = re.search(r"Languages\s*([A-Za-z, ]{3,200})", text, re.IGNORECASE)
        if not match:
            return []
        return [item.strip() for item in match.group(1).split(",") if item.strip()][:20]

    @staticmethod
    def _extract_tags(text: str) -> List[str]:
        hints = ["Strategy", "Role Playing", "Puzzle", "Shooter", "Simulation", "Casual", "Adventure", "Action"]
        return [h for h in hints if re.search(rf"\b{re.escape(h)}\b", text, re.IGNORECASE)]

    @staticmethod
    def _extract_image_urls(html: str) -> List[str]:
        found = re.findall(r'https?://[^"\'\s>]+(?:png|jpg|jpeg|webp)', html, flags=re.IGNORECASE)
        uniq = []
        for url in found:
            if url not in uniq:
                uniq.append(url)
            if len(uniq) >= 10:
                break
        return uniq

    @staticmethod
    def _nested_get(obj: Dict, path: List[str]):
        cur = obj
        for p in path:
            if not isinstance(cur, dict):
                return None
            cur = cur.get(p)
        return cur

    @staticmethod
    def _safe_float(value) -> Optional[float]:
        try:
            return float(value)
        except Exception:  # noqa: BLE001
            return None

    @staticmethod
    def _safe_int(value) -> Optional[int]:
        try:
            return int(float(value))
        except Exception:  # noqa: BLE001
            return None

    @staticmethod
    def _evidence_shell(game_name: str, url: str, reason: str) -> Dict:
        return {"game_input_name": game_name, "source_url": url, "status": reason, "field_mapping": {}, "snippets": {}}

    @staticmethod
    def _build_evidence(record: StoreRecord, html: str) -> Dict:
        return {
            "game_input_name": record.game_input_name,
            "source_url": record.source_url,
            "status": "ok",
            "record": asdict(record),
            "field_mapping": {
                "title": "meta:og:title/json-ld",
                "publisher": "json-ld.author.name",
                "description": "meta:og:description",
                "release_date": "text label",
                "update_date": "text label",
                "categories": "json-ld.applicationCategory/text tags",
                "has_iap": "text includes In-app purchases",
                "has_ads": "text includes Contains ads/advertising",
                "price_range": "json-ld.offers.price",
                "rating": "json-ld.aggregateRating.ratingValue",
                "rating_count": "json-ld.aggregateRating.ratingCount",
                "languages": "text near Languages",
                "screenshots": "json-ld.screenshot|image / URL regex",
            },
            "snippets": {
                "description": (record.description or "")[:500],
                "html_sample": html[:800],
            },
        }
