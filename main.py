from __future__ import annotations

import argparse
import csv
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Tuple

from exporters.csv_exporter import Exporter
from exporters.summary_exporter import write_summary
from fetchers.store_fetcher import StoreFetcher
from parsers.inference import InferenceEngine
from parsers.ocr_helper import extract_ocr_keywords
from utils.models import DeepDiveRecord, StoreRecord

LOGGER = logging.getLogger("game-research-assistant")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mobile game monetization deep research assistant")
    parser.add_argument("--input", required=True, help="CSV path with columns: game_name,store_url")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--region", default="EU")
    parser.add_argument("--year", default="2025")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--ocr", action="store_true", help="Enable optional lightweight OCR placeholder")
    parser.add_argument("--summary", action="store_true", help="Generate summary.md")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args()


def load_games(path: Path) -> List[Tuple[str, str]]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("game_name") or row.get("Game") or "").strip()
            url = (row.get("store_url") or row.get("URL") or "").strip()
            if name and url:
                rows.append((name, url))
    return rows


def load_existing_cache(out_dir: Path) -> Dict[str, Dict]:
    cache_file = out_dir / "evidence.json"
    if not cache_file.exists():
        return {}
    with cache_file.open("r", encoding="utf-8") as f:
        data = json.load(f)
    result = {}
    for item in data:
        key = item.get("source_url")
        if key:
            result[key] = item
    return result


def build_deep_dive_row(
    record: StoreRecord,
    inference: Dict,
    region: str,
    ocr_terms: List[str],
) -> DeepDiveRecord:
    src_links = record.source_url
    iap_primary = inference["IAP primary type"].value
    if ocr_terms:
        if iap_primary == "Unknown":
            iap_primary = "OCR hint:" + "|".join(ocr_terms)
        else:
            iap_primary += f" (ocr:{'|'.join(ocr_terms)})"

    return DeepDiveRecord(
        game=record.title or record.game_input_name,
        release_date=record.release_date or "Unknown",
        eu_focus_markets=region,
        genre=f"{inference['Genre'].value} (conf:{inference['Genre'].confidence:.2f}; ev:{inference['Genre'].evidence_snippet})",
        hybrid_type=f"{inference['Monetization mix'].value} (conf:{inference['Monetization mix'].confidence:.2f}; ev:{inference['Monetization mix'].evidence_snippet})",
        core_loop="TODO (manual required)",
        session_length=f"{inference['Session length'].value} (conf:{inference['Session length'].confidence:.2f}; rule:{inference['Session length'].evidence_snippet})",
        social_competition="TODO (manual required)",
        art_style=f"{inference['Art style'].value} (conf:{inference['Art style'].confidence:.2f}; ev:{inference['Art style'].evidence_snippet})",
        theme_setting=f"{inference['Theme'].value} (conf:{inference['Theme'].confidence:.2f}; ev:{inference['Theme'].evidence_snippet})",
        monetization_iap_primary=iap_primary,
        monetization_ads="Yes" if record.has_ads else ("No" if record.has_ads is False else "Unknown"),
        pricing_offers="TODO (manual required; store price captured partially)",
        liveops_cadence="TODO (manual required)",
        key_events="TODO (manual required)",
        growth_type="TODO",
        differentiator="TODO (manual required)",
        risks="TODO (manual required)",
        potential_score="TODO (manual required)",
        sources_links=src_links,
    )


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level.upper(), logging.INFO), format="%(asctime)s [%(levelname)s] %(message)s")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    games = load_games(Path(args.input))
    LOGGER.info("Loaded %s games from input", len(games))

    fetcher = StoreFetcher()
    inference_engine = InferenceEngine()
    exporter = Exporter(out_dir)

    existing = load_existing_cache(out_dir)
    evidence_items = []
    store_records: List[StoreRecord] = []

    futures = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for name, url in games:
            if (not args.refresh) and url in existing and existing[url].get("status") == "ok":
                raw = existing[url].get("record")
                if raw:
                    store_records.append(StoreRecord(**raw))
                    evidence_items.append(existing[url])
                    LOGGER.info("Skip cached: %s", url)
                continue
            futures.append(pool.submit(fetcher.fetch, name, url))

        for future in as_completed(futures):
            record, evidence = future.result()
            evidence_items.append(evidence)
            if record:
                store_records.append(record)

    deep_rows: List[DeepDiveRecord] = []
    todo_map: Dict[str, List[str]] = {}
    summary_tags: List[Dict[str, str]] = []

    for record in store_records:
        inference = inference_engine.infer(record)
        ocr_terms = extract_ocr_keywords(record.screenshots, enabled=args.ocr)
        row = build_deep_dive_row(record, inference, args.region, ocr_terms)
        deep_rows.append(row)
        todo_map[row.game] = [
            "Core loop",
            "Social/Competition",
            "Pricing/Offers",
            "LiveOps cadence",
            "Key events",
            "Differentiator",
            "Risks",
            "Potential score",
        ]
        summary_tags.append({"Genre": inference["Genre"].value, "Monetization mix": inference["Monetization mix"].value})

    exporter.write_candidate_pool(store_records)
    exporter.write_deep_dive(deep_rows)
    exporter.write_evidence(evidence_items)
    exporter.write_manual_todo(todo_map)

    if args.summary:
        write_summary(out_dir, summary_tags)

    LOGGER.info("Done. Output folder: %s", out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
