"""
Vyom NLP Scam Detector

Pattern-weighted scam signal analyzer.
Designed to be progressively enhanced with transformer-based models
(e.g. fine-tuned BERT) without API surface changes.
"""

import re
import math
from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class SignalPattern:
    name: str
    pattern: re.Pattern
    weight: float
    category: str
    description: str


SIGNAL_PATTERNS: List[SignalPattern] = [
    # Credential extraction attempts
    SignalPattern("otp_request", re.compile(r"\b(otp|one[\s-]time[\s-]pass(?:word|code)?)\b", re.I), 28.0, "phishing", "OTP/one-time password solicitation"),
    SignalPattern("password_request", re.compile(r"\b(password|passcode|pin|secret[\s-]?code)\b", re.I), 30.0, "identity_theft", "Password or PIN request"),
    SignalPattern("cvv_request", re.compile(r"\b(cvv|cvc|card[\s-]?verification|security[\s-]?code)\b", re.I), 32.0, "financial_fraud", "CVV/card verification solicitation"),

    # Financial fraud patterns
    SignalPattern("account_details", re.compile(r"\b(bank[\s-]?account|account[\s-]?number|sort[\s-]?code|iban|swift[\s-]?code)\b", re.I), 25.0, "financial_fraud", "Bank account details request"),
    SignalPattern("wire_transfer", re.compile(r"\b(wire[\s-]?transfer|send[\s-]?money|transfer[\s-]?funds|money[\s-]?gram|western[\s-]?union)\b", re.I), 30.0, "financial_fraud", "Wire transfer instruction"),
    SignalPattern("crypto_payment", re.compile(r"\b(bitcoin|crypto(?:currency)?|ethereum|usdt|wallet[\s-]?address)\b", re.I), 22.0, "financial_fraud", "Cryptocurrency payment request"),

    # Urgency manipulation
    SignalPattern("urgency", re.compile(r"\b(urgent|immediately|right\s+now|act\s+now|expire[sd]?|limited\s+time|last\s+chance|hours?\s+left)\b", re.I), 15.0, "urgency_manipulation", "Urgency pressure tactics"),
    SignalPattern("account_threat", re.compile(r"\b(suspend(?:ed)?|block(?:ed)?|disable[d]?|restrict(?:ed)?|clos(?:ed?|ing))\b.{0,40}\b(account|card|access)\b", re.I), 22.0, "urgency_manipulation", "Account suspension threat"),

    # Prize and reward scams
    SignalPattern("prize_claim", re.compile(r"\b(lottery|jackpot|prize|reward|gift[\s-]?card|won\b|winner|selected|chosen)\b", re.I), 20.0, "prize_scam", "Prize or lottery claim"),
    SignalPattern("free_money", re.compile(r"\b(free[\s-]?money|cash[\s-]?reward|bonus[\s-]?credit|unclaimed[\s-]?fund|inheritance)\b", re.I), 25.0, "prize_scam", "Free money or inheritance offer"),

    # Phishing patterns
    SignalPattern("verify_account", re.compile(r"\b(verify[\s-]?your|confirm[\s-]?your|update[\s-]?your|validate[\s-]?your)\b.{0,30}\b(account|identity|detail|information)\b", re.I), 22.0, "phishing", "Account verification phishing"),
    SignalPattern("click_link", re.compile(r"\b(click[\s-]?(?:here|this|the[\s-]?link)|tap[\s-]?(?:here|below)|visit[\s-]?(?:this|the)[\s-]?link)\b", re.I), 15.0, "phishing", "Suspicious link click request"),
    SignalPattern("suspicious_domain", re.compile(r"https?://\S+\.(xyz|top|tk|ml|ga|cf|gq|click|download|pw)\b", re.I), 30.0, "phishing", "Suspicious domain in message"),

    # Impersonation
    SignalPattern("gov_impersonation", re.compile(r"\b(government|irs|hmrc|income\s+tax|tax\s+refund|tax\s+return|customs|immigration)\b", re.I), 18.0, "impersonation", "Government agency impersonation"),
    SignalPattern("bank_impersonation", re.compile(r"\b(your\s+bank|your\s+card\s+provider|customer\s+(?:care|service|support))\b.{0,40}\b(call|contact|reach)\b", re.I), 20.0, "impersonation", "Bank impersonation"),

    # Social engineering
    SignalPattern("secrecy_request", re.compile(r"\b(don[\'\u2019]?t\s+tell|keep\s+(?:this\s+)?secret|between\s+(?:us|you\s+and\s+me)|don[\'\u2019]?t\s+share)\b", re.I), 18.0, "urgency_manipulation", "Secrecy instruction"),
    SignalPattern("forward_pressure", re.compile(r"\b(forward\s+this|share\s+this|send\s+to\s+(?:all|everyone|your\s+contacts))\b", re.I), 12.0, "urgency_manipulation", "Chain message pressure"),
]


class ScamDetector:
    """
    Multi-signal NLP scam detector using weighted pattern matching.

    Designed to be swapped for a trained transformer model without
    changing the public `analyze()` interface.
    """

    def analyze(self, content: str) -> Dict:
        matched: List[Tuple[SignalPattern, re.Match]] = []
        categories = set()

        for sig in SIGNAL_PATTERNS:
            m = sig.pattern.search(content)
            if m:
                matched.append((sig, m))
                categories.add(sig.category)

        raw_score = sum(s.weight for s, _ in matched)

        # Boost when multiple independent categories triggered
        unique_cats = len(categories)
        if unique_cats >= 4:
            raw_score *= 1.30
        elif unique_cats >= 3:
            raw_score *= 1.15
        elif unique_cats >= 2:
            raw_score *= 1.05

        # Stylistic signals
        style_score, style_signals = self._check_style(content)
        raw_score += style_score

        final_score = min(round(raw_score, 1), 100.0)
        confidence = self._compute_confidence(len(matched), len(content))

        signals = [s.description for s, _ in matched] + style_signals

        return {
            "risk_score": final_score,
            "confidence": round(confidence, 3),
            "breakdown": {
                "pattern_score": round(sum(s.weight for s, _ in matched), 1),
                "style_score": round(style_score, 1),
                "signals_matched": len(matched),
                "unique_categories": unique_cats,
            },
            "signals": signals,
            "categories": list(categories) if categories else ["safe"],
        }

    def _check_style(self, text: str) -> Tuple[float, List[str]]:
        score = 0.0
        signals = []

        if len(text) > 15:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.45:
                score += 12.0
                signals.append("excessive_capitalization")

        exclamation_count = text.count('!')
        if exclamation_count >= 3:
            score += 8.0
            signals.append("multiple_exclamation_marks")

        # Emoji spam
        emoji_pattern = re.compile(
            "[\U00010000-\U0010ffff]", flags=re.UNICODE
        )
        emoji_count = len(emoji_pattern.findall(text))
        if emoji_count >= 5:
            score += 6.0
            signals.append("emoji_spam")

        return score, signals

    def _compute_confidence(self, matched_count: int, text_length: int) -> float:
        if text_length < 10:
            return 0.5
        signal_density = matched_count / max(text_length / 100, 1)
        return 0.5 + 0.48 * (1 - math.exp(-2 * signal_density))
