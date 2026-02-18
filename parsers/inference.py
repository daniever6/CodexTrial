from __future__ import annotations

import re
from typing import Dict, List, Tuple

from utils.models import InferenceResult, StoreRecord

GENRE_RULES: Dict[str, List[str]] = {
    "SLG/4X": ["strategy", "alliance", "kingdom", "empire", "4x"],
    "Shooter": ["shooter", "gun", "sniper", "fps", "tps"],
    "RPG": ["rpg", "role playing", "hero", "quest", "gacha"],
    "Puzzle": ["puzzle", "match", "tile", "brain"],
    "Sim": ["simulation", "simulator", "tycoon", "build"],
    "Party": ["party", "multiplayer mini", "social"],
    "Casual": ["casual", "relax", "idle", "merge"],
}

ART_STYLE_RULES = {
    "Realistic": ["realistic", "high-fidelity", "immersive graphics"],
    "Stylized": ["stylized", "vibrant", "unique art"],
    "Cartoon": ["cartoon", "cute", "funny", "chibi"],
    "Anime": ["anime", "otaku", "manga"],
}

THEME_RULES = {
    "Medieval": ["medieval", "castle", "knight", "kingdom"],
    "Modern military": ["military", "modern warfare", "special forces"],
    "Post-apocalypse": ["apocalypse", "zombie", "wasteland"],
    "Sci-fi": ["sci-fi", "space", "future", "cyber"],
    "Fantasy": ["dragon", "magic", "fantasy", "elf"],
    "Urban/Crime": ["mafia", "city", "crime", "gang"],
    "IP/Anime": ["anime", "official", "licensed", "ip collaboration"],
}

IAP_PRIMARY_RULES = {
    "Battle Pass": ["battle pass", "season pass"],
    "Monthly card": ["monthly card", "monthly pass", "subscription"],
    "Gacha": ["gacha", "summon", "draw", "loot box"],
    "Skins": ["skin", "cosmetic"],
    "Tier packs": ["pack", "bundle", "tier"],
    "Starter pack": ["starter pack", "first purchase", "newbie pack"],
    "VIP": ["vip", "svip"],
}

SESSION_RULES = {
    "L": ["strategy", "slg", "4x", "rpg", "raid", "guild war"],
    "M": ["simulation", "sim", "midcore", "coop", "adventure"],
    "S": ["casual", "puzzle", "merge", "idle", "hypercasual"],
}


class InferenceEngine:
    def infer(self, record: StoreRecord) -> Dict[str, InferenceResult]:
        text = self._compose_text(record)

        genre = self._rule_pick(text, GENRE_RULES, fallback="Unknown")
        art_style = self._rule_pick(text, ART_STYLE_RULES, fallback="Unknown")
        theme = self._rule_pick(text, THEME_RULES, fallback="Unknown")
        iap_primary = self._rule_multi(text, IAP_PRIMARY_RULES, fallback="Unknown")
        monetization_mix = self._infer_monetization_mix(record, iap_primary.value)
        session_length = self._infer_session_length(text, genre.value)

        return {
            "Genre": genre,
            "Art style": art_style,
            "Theme": theme,
            "Monetization mix": monetization_mix,
            "IAP primary type": iap_primary,
            "Session length": session_length,
        }

    @staticmethod
    def _compose_text(record: StoreRecord) -> str:
        return " ".join(
            [
                record.title or "",
                record.description or "",
                " ".join(record.categories),
                " ".join(record.tags),
            ]
        ).lower()

    def _rule_pick(self, text: str, rulebook: Dict[str, List[str]], fallback: str) -> InferenceResult:
        best_label = fallback
        best_hits: List[str] = []
        for label, keywords in rulebook.items():
            hits = [kw for kw in keywords if re.search(rf"\b{re.escape(kw)}\b", text)]
            if len(hits) > len(best_hits):
                best_label = label
                best_hits = hits
        if best_label == fallback:
            return InferenceResult(value=fallback, confidence=0.0, evidence_snippet="No reliable keyword hit")
        conf = min(0.95, 0.45 + 0.15 * len(best_hits))
        return InferenceResult(value=best_label, confidence=conf, evidence_snippet=", ".join(best_hits[:5]))

    def _rule_multi(self, text: str, rulebook: Dict[str, List[str]], fallback: str) -> InferenceResult:
        labels = []
        hits_all = []
        for label, keywords in rulebook.items():
            hits = [kw for kw in keywords if re.search(rf"\b{re.escape(kw)}\b", text)]
            if hits:
                labels.append(label)
                hits_all.extend(hits)
        if not labels:
            return InferenceResult(value=fallback, confidence=0.0, evidence_snippet="No monetization keyword hit")
        conf = min(0.95, 0.5 + 0.1 * len(labels))
        return InferenceResult(value="Multiple:" + "|".join(labels) if len(labels) > 1 else labels[0], confidence=conf, evidence_snippet=", ".join(hits_all[:6]))

    def _infer_monetization_mix(self, record: StoreRecord, iap_primary: str) -> InferenceResult:
        if record.has_iap and record.has_ads:
            return InferenceResult(value="Hybrid", confidence=0.9, evidence_snippet="Store flags include IAP and Ads")
        if record.has_iap:
            conf = 0.85 if iap_primary != "Unknown" else 0.7
            return InferenceResult(value="IAP", confidence=conf, evidence_snippet="Store indicates in-app purchases")
        if record.has_ads:
            return InferenceResult(value="IAA", confidence=0.8, evidence_snippet="Store indicates ads")
        return InferenceResult(value="Unknown", confidence=0.0, evidence_snippet="No store monetization metadata")

    def _infer_session_length(self, text: str, genre: str) -> InferenceResult:
        source = f"genre={genre}"
        for label, kws in SESSION_RULES.items():
            hits = [kw for kw in kws if kw in text or kw == genre.lower()]
            if hits:
                return InferenceResult(
                    value=label,
                    confidence=0.65 if len(hits) == 1 else 0.8,
                    evidence_snippet=f"session_rules:{'|'.join(hits[:4])}; {source}",
                )
        if genre in {"SLG/4X", "RPG"}:
            return InferenceResult(value="L", confidence=0.55, evidence_snippet="genre prior rule (mid/high depth)")
        if genre in {"Puzzle", "Casual"}:
            return InferenceResult(value="S", confidence=0.55, evidence_snippet="genre prior rule (short loops)")
        return InferenceResult(value="Unknown", confidence=0.0, evidence_snippet="Insufficient genre/keyword evidence")
