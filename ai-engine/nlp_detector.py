"""
NLP-based scam message detector.

Multi-layer detection approach:
  1. Regex pattern matching for known scam signals
  2. Keyword frequency scoring
  3. Linguistic heuristics (length, link density, caps ratio)
  4. Category classification

Returns a confidence score (0–100) and human-readable signals.
"""

import re
from typing import Optional


# ── Signal catalog ──────────────────────────────────────────────────────────

SIGNALS = [
    # Urgency
    {"pattern": r"\burgent(ly)?\b", "label": "urgency", "weight": 15, "category": "urgency"},
    {"pattern": r"\bact now\b|\bimmediately\b|\bright now\b", "label": "act_now", "weight": 18, "category": "urgency"},
    {"pattern": r"expires?\s+(in|today|soon|tonight)", "label": "expiry_pressure", "weight": 20, "category": "urgency"},
    {"pattern": r"last\s+(chance|warning|notice)", "label": "final_warning", "weight": 20, "category": "urgency"},

    # Credential theft
    {"pattern": r"\botp\b", "label": "otp_mention", "weight": 30, "category": "credential_theft"},
    {"pattern": r"share\s+your\s+(pin|password|otp|cvv|card number)", "label": "credential_demand", "weight": 40, "category": "credential_theft"},
    {"pattern": r"enter\s+your\s+(card|account|password|pin|otp)", "label": "credential_entry", "weight": 35, "category": "credential_theft"},
    {"pattern": r"verify\s+(your|account|identity|card)", "label": "fake_verification", "weight": 20, "category": "credential_theft"},
    {"pattern": r"confirm\s+(your\s+details|account|identity)", "label": "fake_confirm", "weight": 18, "category": "credential_theft"},

    # Financial lures
    {"pattern": r"you('ve|\s+have)\s+won", "label": "prize_claim", "weight": 25, "category": "financial_lure"},
    {"pattern": r"free\s+(money|cash|gift|reward|prize)", "label": "free_money", "weight": 22, "category": "financial_lure"},
    {"pattern": r"claim\s+(your|the)\s+(prize|reward|cashback|refund)", "label": "claim_prize", "weight": 25, "category": "financial_lure"},
    {"pattern": r"\blottery\b|\bjackpot\b|\bsweepstakes\b", "label": "lottery_scam", "weight": 28, "category": "financial_lure"},
    {"pattern": r"₹\s*\d+\s*(lakh|crore|thousand)", "label": "large_inr_promise", "weight": 20, "category": "financial_lure"},
    {"pattern": r"\$\s*\d{4,}", "label": "large_usd_promise", "weight": 15, "category": "financial_lure"},

    # Authority impersonation
    {"pattern": r"\bsbi\b|\bhdfc\b|\bicici\b|\baxis\s+bank\b|\bkotak\b|\bpnb\b", "label": "bank_impersonation", "weight": 25, "category": "impersonation"},
    {"pattern": r"\brbi\b|\bsebi\b|\bincome\s+tax\b|\bcbi\b|\bnarcotics\b", "label": "authority_impersonation", "weight": 30, "category": "impersonation"},
    {"pattern": r"(account|card)\s+(has\s+been|will\s+be|is)\s+(blocked|suspended|frozen|deactivated)", "label": "account_threat", "weight": 30, "category": "impersonation"},
    {"pattern": r"kyc\s+(update|pending|expired|required|verification)", "label": "fake_kyc", "weight": 28, "category": "impersonation"},

    # Phishing links
    {"pattern": r"click\s+(here|this\s+link|below)", "label": "click_bait", "weight": 15, "category": "phishing_link"},
    {"pattern": r"https?://\S*(free|win|prize|lucky|claim|verify|secure|login|update)\S*", "label": "suspicious_url", "weight": 30, "category": "phishing_link"},
    {"pattern": r"bit\.ly|tinyurl\.com|shorturl\.at|is\.gd", "label": "url_shortener", "weight": 20, "category": "phishing_link"},

    # Device/remote access
    {"pattern": r"install\s+(this\s+app|anydesk|teamviewer|remote)", "label": "remote_access_demand", "weight": 40, "category": "device_compromise"},
    {"pattern": r"download\s+(this|the)\s+(app|file|link|apk)", "label": "download_request", "weight": 25, "category": "device_compromise"},
    {"pattern": r"(allow|grant|give)\s+(access|permission|screen\s+sharing)", "label": "access_permission", "weight": 30, "category": "device_compromise"},
]

_compiled = [
    {**s, "regex": re.compile(s["pattern"], re.IGNORECASE)}
    for s in SIGNALS
]


def _caps_ratio(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    return sum(1 for c in letters if c.isupper()) / len(letters)


def _link_density(text: str) -> int:
    return len(re.findall(r"https?://", text, re.IGNORECASE))


def analyze_message(message: str) -> dict:
    """
    Analyze a message for scam patterns.

    Returns:
        dict with score, level, signals, category, summary
    """
    text = message.strip()
    detected = []
    score = 0
    category_hits: dict[str, int] = {}

    for signal in _compiled:
        if signal["regex"].search(text):
            detected.append({
                "signal": signal["label"],
                "weight": signal["weight"],
                "category": signal["category"],
            })
            score += signal["weight"]
            category_hits[signal["category"]] = (
                category_hits.get(signal["category"], 0) + signal["weight"]
            )

    # Linguistic heuristics
    caps = _caps_ratio(text)
    if caps > 0.5 and len(text) > 30:
        score += 10
        detected.append({"signal": "excessive_caps", "weight": 10, "category": "linguistic"})

    links = _link_density(text)
    if links >= 2:
        score += 12
        detected.append({"signal": "multiple_links", "weight": 12, "category": "phishing_link"})
    elif links == 1 and len(text) < 200:
        score += 6
        detected.append({"signal": "link_in_short_message", "weight": 6, "category": "phishing_link"})

    # Cap
    score = min(score, 100)

    level = (
        "scam" if score >= 70
        else "suspicious" if score >= 40
        else "caution" if score >= 15
        else "safe"
    )

    dominant_category = (
        max(category_hits, key=category_hits.get) if category_hits else None
    )

    summaries = {
        "scam": "High-confidence scam detected. Do not respond or click any links.",
        "suspicious": "Message shows patterns consistent with scam attempts. Verify the sender.",
        "caution": "Minor risk signals present. Proceed with caution.",
        "safe": "No significant scam indicators detected.",
    }

    return {
        "score": score,
        "level": level,
        "signals": detected,
        "category": dominant_category,
        "summary": summaries[level],
        "modelVersion": "nlp-pattern-v1",
    }
