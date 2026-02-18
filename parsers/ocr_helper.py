from __future__ import annotations

from typing import List


def extract_ocr_keywords(image_urls: List[str], enabled: bool = False) -> List[str]:
    """Optional lightweight OCR placeholder.

    Without third-party OCR dependency, uses screenshot URL tokens as weak hints.
    """
    if not enabled:
        return []

    watch_terms = {"battle", "pass", "season", "vip", "starter", "pack"}
    found = set()
    for url in image_urls[:10]:
        lowered = url.lower()
        for term in watch_terms:
            if term in lowered:
                found.add(term)
    return sorted(found)
