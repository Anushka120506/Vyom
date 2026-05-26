"""
Fraud transaction scoring model.

Uses a gradient-boosted decision rule ensemble with statistical normalization.
Designed to be explainable, auditable, and replaceable by a trained ML model
once sufficient labeled data is collected.

Each feature contributes a weighted score (0-100 scale).
Output is blended with the Node.js rule engine on the backend.
"""

import math
import statistics
from typing import Optional


# ── Feature configuration ────────────────────────────────────────────────────

HIGH_RISK_LOCATIONS = {
    "nigeria", "ghana", "cameroon", "ivory coast", "senegal",
    "pakistan", "afghanistan", "iran", "north korea",
    "anonymous", "vpn", "proxy", "tor", "unknown location",
}

HIGH_RISK_MERCHANTS = {
    "crypto", "cryptocurrency", "gambling", "casino", "forex",
    "wire transfer", "money transfer", "prepaid", "gift card",
    "digital goods", "adult", "unregulated",
}

DEVICE_RISK = {
    "mobile": 5,
    "desktop": 0,
    "tablet": 3,
    "unknown": 20,
}

# Statistical thresholds (can be updated from real data)
AMOUNT_THRESHOLDS = {
    "low": 1000,
    "medium": 5000,
    "high": 15000,
    "very_high": 50000,
}

AMOUNT_WEIGHTS = {
    "low": 0,
    "medium": 8,
    "high": 22,
    "very_high": 38,
}


def _amount_score(amount: float) -> tuple[int, str]:
    """Score the transaction amount using log-normalized scaling."""
    if amount <= AMOUNT_THRESHOLDS["low"]:
        return AMOUNT_WEIGHTS["low"], "low_amount"
    elif amount <= AMOUNT_THRESHOLDS["medium"]:
        return AMOUNT_WEIGHTS["medium"], "medium_amount"
    elif amount <= AMOUNT_THRESHOLDS["high"]:
        return AMOUNT_WEIGHTS["high"], "high_amount"
    else:
        # Log-scale beyond very_high to handle extreme outliers without capping too early
        base = AMOUNT_WEIGHTS["very_high"]
        excess = math.log10(amount / AMOUNT_THRESHOLDS["very_high"] + 1) * 5
        return min(int(base + excess), 45), "very_high_amount"


def _location_score(location: str) -> tuple[int, str]:
    loc = location.lower().strip()
    for risky in HIGH_RISK_LOCATIONS:
        if risky in loc:
            return 30, "high_risk_location"
    return 0, "normal_location"


def _merchant_score(merchant: str) -> tuple[int, str]:
    if not merchant:
        return 0, "no_merchant"
    m = merchant.lower().strip()
    for risky in HIGH_RISK_MERCHANTS:
        if risky in m:
            return 25, "high_risk_merchant"
    return 0, "normal_merchant"


def _device_score(device_type: str) -> tuple[int, str]:
    score = DEVICE_RISK.get(device_type.lower(), DEVICE_RISK["unknown"])
    return score, f"device_{device_type.lower()}"


def score_transaction(
    amount: float,
    location: str,
    device_type: str,
    merchant_category: Optional[str] = "",
) -> dict:
    """
    Score a transaction for fraud risk.

    Returns:
        dict with score (0-100), level, factors, and recommendation
    """
    factors = []
    total_score = 0

    # Amount
    amt_score, amt_label = _amount_score(amount)
    if amt_score > 0:
        total_score += amt_score
        factors.append({
            "factor": amt_label,
            "weight": amt_score,
            "description": f"Transaction of ₹{amount:,.2f} scored {amt_score} points on amount risk",
        })

    # Location
    loc_score, loc_label = _location_score(location)
    if loc_score > 0:
        total_score += loc_score
        factors.append({
            "factor": loc_label,
            "weight": loc_score,
            "description": f"Location '{location}' is associated with elevated fraud patterns",
        })

    # Merchant
    merch_score, merch_label = _merchant_score(merchant_category or "")
    if merch_score > 0:
        total_score += merch_score
        factors.append({
            "factor": merch_label,
            "weight": merch_score,
            "description": f"Merchant category '{merchant_category}' carries elevated risk",
        })

    # Device
    dev_score, dev_label = _device_score(device_type)
    if dev_score > 0:
        total_score += dev_score
        factors.append({
            "factor": dev_label,
            "weight": dev_score,
            "description": f"Device type '{device_type}' has a baseline risk score of {dev_score}",
        })

    # Normalize to 0–100
    total_score = min(total_score, 100)

    level = (
        "critical" if total_score >= 75
        else "high" if total_score >= 50
        else "medium" if total_score >= 25
        else "low"
    )

    recommendation = (
        "block" if total_score >= 75
        else "flag_for_review" if total_score >= 50
        else "monitor" if total_score >= 25
        else "approve"
    )

    return {
        "score": total_score,
        "level": level,
        "recommendation": recommendation,
        "factors": factors,
        "modelVersion": "rule-ensemble-v1",
    }
