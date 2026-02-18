from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any


@dataclass
class StoreRecord:
    game_input_name: str
    source_url: str
    platform: str
    title: Optional[str] = None
    publisher: Optional[str] = None
    release_date: Optional[str] = None
    update_date: Optional[str] = None
    description: Optional[str] = None
    categories: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    has_iap: Optional[bool] = None
    has_ads: Optional[bool] = None
    price_range: Optional[str] = None
    rating: Optional[float] = None
    rating_count: Optional[int] = None
    languages: List[str] = field(default_factory=list)
    screenshots: List[str] = field(default_factory=list)
    links: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["categories"] = "|".join(self.categories)
        payload["tags"] = "|".join(self.tags)
        payload["languages"] = "|".join(self.languages)
        payload["screenshots"] = "|".join(self.screenshots)
        return payload


@dataclass
class InferenceResult:
    value: str
    confidence: float
    evidence_snippet: str


@dataclass
class DeepDiveRecord:
    game: str
    release_date: str
    eu_focus_markets: str
    genre: str
    hybrid_type: str
    core_loop: str
    session_length: str
    social_competition: str
    art_style: str
    theme_setting: str
    monetization_iap_primary: str
    monetization_ads: str
    pricing_offers: str
    liveops_cadence: str
    key_events: str
    growth_type: str
    differentiator: str
    risks: str
    potential_score: str
    sources_links: str

    def to_csv_row(self) -> Dict[str, str]:
        return {
            "Game": self.game,
            "Release date": self.release_date,
            "EU focus markets": self.eu_focus_markets,
            "Genre": self.genre,
            "Hybrid type": self.hybrid_type,
            "Core loop": self.core_loop,
            "Session length": self.session_length,
            "Social/Competition": self.social_competition,
            "Art style": self.art_style,
            "Theme/Setting": self.theme_setting,
            "Monetization - IAP (primary)": self.monetization_iap_primary,
            "Monetization - Ads": self.monetization_ads,
            "Pricing/Offers": self.pricing_offers,
            "LiveOps cadence": self.liveops_cadence,
            "Key events": self.key_events,
            "Growth type": self.growth_type,
            "Differentiator": self.differentiator,
            "Risks": self.risks,
            "Potential score": self.potential_score,
            "Sources/links": self.sources_links,
        }
