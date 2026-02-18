from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, Iterable, List

from utils.models import DeepDiveRecord, StoreRecord


class Exporter:
    def __init__(self, out_dir: Path):
        self.out_dir = out_dir
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def write_candidate_pool(self, records: Iterable[StoreRecord]) -> Path:
        path = self.out_dir / "CandidatePool.csv"
        fields = [
            "Game",
            "Publisher",
            "Platform",
            "Release date",
            "Last update",
            "Category/Tags",
            "Rating",
            "Rating count",
            "Has IAP",
            "Has Ads",
            "Price",
            "Languages",
            "Growth signal",
            "links",
        ]
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for r in records:
                writer.writerow(
                    {
                        "Game": r.title or r.game_input_name,
                        "Publisher": r.publisher or "Unknown",
                        "Platform": r.platform,
                        "Release date": r.release_date or "Unknown",
                        "Last update": r.update_date or "Unknown",
                        "Category/Tags": "|".join(filter(None, r.categories + r.tags)),
                        "Rating": r.rating if r.rating is not None else "Unknown",
                        "Rating count": r.rating_count if r.rating_count is not None else "Unknown",
                        "Has IAP": r.has_iap if r.has_iap is not None else "Unknown",
                        "Has Ads": r.has_ads if r.has_ads is not None else "Unknown",
                        "Price": r.price_range or "Unknown",
                        "Languages": "|".join(r.languages),
                        "Growth signal": "TODO",
                        "links": r.source_url,
                    }
                )
        return path

    def write_deep_dive(self, rows: Iterable[DeepDiveRecord]) -> Path:
        path = self.out_dir / "DeepDive.csv"
        rows = list(rows)
        default_fields = [
            "Game", "Release date", "EU focus markets", "Genre", "Hybrid type", "Core loop",
            "Session length", "Social/Competition", "Art style", "Theme/Setting",
            "Monetization - IAP (primary)", "Monetization - Ads", "Pricing/Offers",
            "LiveOps cadence", "Key events", "Growth type", "Differentiator", "Risks",
            "Potential score", "Sources/links",
        ]
        with path.open("w", newline="", encoding="utf-8") as f:
            fieldnames = list(rows[0].to_csv_row().keys()) if rows else default_fields
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in rows:
                writer.writerow(row.to_csv_row())
        return path

    def write_evidence(self, evidence_items: List[Dict]) -> Path:
        path = self.out_dir / "evidence.json"
        with path.open("w", encoding="utf-8") as f:
            json.dump(evidence_items, f, ensure_ascii=False, indent=2)
        return path

    def write_manual_todo(self, todo_map: Dict[str, List[str]]) -> Path:
        path = self.out_dir / "manual_todo.md"
        guidance = [
            "- Core loop：进入新手引导后记录‘战斗-养成-资源获取’循环。",
            "- Social/Competition：确认联盟/公会、排行榜、PVP/PVE 协作强度。",
            "- Pricing/Offers：记录首充、月卡、战令、礼包弹窗频率与价格梯度。",
            "- LiveOps cadence：观察活动页 7-14 天，统计活动更新频率。",
            "- Key events：记录限时活动主题、付费关联、复刻周期。",
            "- Differentiator：对比同品类头部竞品，提炼玩法/题材/美术差异。",
            "- Risks：识别合规、买量成本、题材红海、留存风险。",
            "- Potential score：根据留存、ARPU、买量天花板人工打分。",
        ]
        with path.open("w", encoding="utf-8") as f:
            f.write("# Manual Follow-up TODO\n\n")
            f.write("## 通用人工核查指引\n")
            for line in guidance:
                f.write(f"{line}\n")
            f.write("\n## 按游戏待确认项\n")
            for game, items in todo_map.items():
                f.write(f"\n### {game}\n")
                for item in items:
                    f.write(f"- {item}\n")
        return path
