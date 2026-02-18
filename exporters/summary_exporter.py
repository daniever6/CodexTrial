from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Dict, Iterable


def write_summary(out_dir: Path, tags: Iterable[Dict[str, str]]) -> Path:
    genre_counter = Counter()
    mix_counter = Counter()
    for item in tags:
        genre_counter[item.get("Genre", "Unknown")] += 1
        mix_counter[item.get("Monetization mix", "Unknown")] += 1

    path = out_dir / "summary.md"
    with path.open("w", encoding="utf-8") as f:
        f.write("# Portfolio Summary\n\n")
        f.write("## Genre distribution\n")
        for key, value in genre_counter.most_common():
            f.write(f"- {key}: {value}\n")
        f.write("\n## Monetization mix distribution\n")
        for key, value in mix_counter.most_common():
            f.write(f"- {key}: {value}\n")
    return path
