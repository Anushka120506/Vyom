"""
Vyom Fraud Scoring Engine

Rule-based + feature-engineered fraud risk scorer.
Designed to be replaced or augmented with a trained ML model (scikit-learn, XGBoost)
without changing the interface.
"""

from dataclasses import dataclass, field
from typing import Dict, List
import math


# High-risk country/region keywords based on fraud pattern data
HIGH_RISK_LOCATIONS = {
    "nigeria", "ghana", "benin", "ivory coast", "cameroon",
    "foreign", "international", "overseas", "abroad", "unknown location",
}

# Known safe domestic regions (lower risk weight)
LOW_RISK_LOCATIONS = {
    "home", "local", "domestic", "same city", "nearby",
}

# Device patterns that indicate elevated risk
RISKY_DEVICE_PATTERNS = [
    "unknown", "new device", "unrecognized", "rooted", "emulator",
    "vpn", "proxy", "tor", "virtual", "burner",
]

# Merchant categories with historical fraud elevation
HIGH_RISK_MERCHANTS = {
    "cryptocurrency", "crypto", "gambling", "adult", "wire transfer",
    "money transfer", "prepaid card", "gift card", "pawn",
}

LOW_RISK_MERCHANTS = {
    "grocery", "supermarket", "pharmacy", "hospital", "utilities",
    "government", "insurance", "education",
}


@dataclass
class ScoreComponent:
    name: str
    score: float
    weight: float
    triggered: bool
    reason: str = ""


class FraudScorer:
    """
    Weighted multi-signal fraud risk scorer.

    Each component contributes to a 0–100 risk score.
    Components are designed to mirror real-world fraud detection logic.
    """

    def score(
        self,
        amount: float,
        location: str,
        device: str,
        merchant_category: str = "unknown",
    ) -> Dict:
        components: List[ScoreComponent] = []

        # --- Amount scoring ---
        amount_score = self._score_amount(amount)
        components.append(ScoreComponent(
            name="amount_risk",
            score=amount_score,
            weight=0.30,
            triggered=amount_score > 0,
            reason=self._amount_reason(amount),
        ))

        # --- Location scoring ---
        loc_score, loc_reason = self._score_location(location)
        components.append(ScoreComponent(
            name="location_risk",
            score=loc_score,
            weight=0.25,
            triggered=loc_score > 0,
            reason=loc_reason,
        ))

        # --- Device scoring ---
        dev_score, dev_reason = self._score_device(device)
        components.append(ScoreComponent(
            name="device_risk",
            score=dev_score,
            weight=0.25,
            triggered=dev_score > 0,
            reason=dev_reason,
        ))

        # --- Merchant category scoring ---
        merch_score, merch_reason = self._score_merchant(merchant_category)
        components.append(ScoreComponent(
            name="merchant_risk",
            score=merch_score,
            weight=0.20,
            triggered=merch_score > 0,
            reason=merch_reason,
        ))

        # Weighted aggregate
        raw_score = sum(c.score * c.weight for c in components)

        # Amplify when multiple high-risk signals co-occur
        triggered_count = sum(1 for c in components if c.triggered and c.score > 50)
        if triggered_count >= 3:
            raw_score = min(raw_score * 1.25, 100)
        elif triggered_count >= 2:
            raw_score = min(raw_score * 1.10, 100)

        final_score = round(raw_score, 1)
        confidence = self._compute_confidence(components)

        return {
            "risk_score": final_score,
            "confidence": round(confidence, 3),
            "breakdown": {c.name: round(c.score, 1) for c in components},
            "signals": [c.reason for c in components if c.triggered and c.reason],
        }

    def _score_amount(self, amount: float) -> float:
        if amount <= 0:
            return 5.0
        if amount > 100_000:
            return 95.0
        if amount > 50_000:
            return 80.0
        if amount > 20_000:
            return 65.0
        if amount > 10_000:
            return 50.0
        if amount > 5_000:
            return 35.0
        if amount > 1_000:
            return 15.0
        return 5.0

    def _amount_reason(self, amount: float) -> str:
        if amount > 50_000:
            return "extremely_large_transaction"
        if amount > 10_000:
            return "high_value_transaction"
        if amount > 5_000:
            return "elevated_transaction_amount"
        return ""

    def _score_location(self, location: str) -> tuple:
        loc = location.lower().strip()

        for high_risk in HIGH_RISK_LOCATIONS:
            if high_risk in loc:
                return 85.0, "high_risk_geographic_region"

        for low_risk in LOW_RISK_LOCATIONS:
            if low_risk in loc:
                return 5.0, ""

        # Unknown/ambiguous location — moderate risk
        if len(loc) < 3 or loc in ("n/a", "na", "none", "-"):
            return 50.0, "location_not_provided"

        return 20.0, ""

    def _score_device(self, device: str) -> tuple:
        dev = device.lower().strip()

        for pattern in RISKY_DEVICE_PATTERNS:
            if pattern in dev:
                return 80.0, f"suspicious_device_pattern:{pattern}"

        if len(dev) < 3 or dev in ("n/a", "na", "none", "-"):
            return 45.0, "device_unidentified"

        return 10.0, ""

    def _score_merchant(self, category: str) -> tuple:
        cat = category.lower().strip()

        for high in HIGH_RISK_MERCHANTS:
            if high in cat:
                return 75.0, f"high_risk_merchant:{high}"

        for low in LOW_RISK_MERCHANTS:
            if low in cat:
                return 5.0, ""

        if cat in ("unknown", "", "other"):
            return 30.0, "unknown_merchant_category"

        return 15.0, ""

    def _compute_confidence(self, components: List[ScoreComponent]) -> float:
        """
        Confidence is higher when more components have clear signals.
        Low when most components are at default/ambiguous values.
        """
        signal_strength = sum(
            min(c.score / 100, 1.0) * c.weight for c in components
        )
        # Sigmoid-like mapping to 0.5–0.99 range
        return 0.5 + 0.49 * (1 - math.exp(-3 * signal_strength))
