/**
 * Scam message analysis service.
 * Multi-layer NLP approach: pattern matching → keyword scoring → linguistic heuristics.
 * Returns confidence score, detected signals, and category classification.
 */

const logger = require("../config/logger");

// Phishing / scam signal patterns with weights
const SIGNAL_PATTERNS = [
  // Urgency signals
  { pattern: /urgent(ly)?/i, label: "urgency", weight: 15, category: "urgency" },
  { pattern: /act now|immediately|right now|don'?t wait/i, label: "act_immediately", weight: 18, category: "urgency" },
  { pattern: /expires? (in|today|soon|tonight)/i, label: "expiry_pressure", weight: 20, category: "urgency" },
  { pattern: /last (chance|warning|notice)/i, label: "final_warning", weight: 20, category: "urgency" },

  // Credential harvesting
  { pattern: /\botp\b/i, label: "otp_request", weight: 30, category: "credential_theft" },
  { pattern: /share your (pin|password|otp|cvv)/i, label: "credential_demand", weight: 40, category: "credential_theft" },
  { pattern: /enter your (card|account|password|pin)/i, label: "credential_entry", weight: 35, category: "credential_theft" },
  { pattern: /verify (your|account|identity|card)/i, label: "fake_verification", weight: 20, category: "credential_theft" },
  { pattern: /confirm (your details|account|identity)/i, label: "fake_confirm", weight: 18, category: "credential_theft" },

  // Financial lures
  { pattern: /you('ve| have) won/i, label: "prize_claim", weight: 25, category: "financial_lure" },
  { pattern: /free (money|cash|gift|reward|prize)/i, label: "free_money", weight: 22, category: "financial_lure" },
  { pattern: /claim (your|the) (prize|reward|cashback|refund)/i, label: "claim_prize", weight: 25, category: "financial_lure" },
  { pattern: /lottery|jackpot|sweepstakes/i, label: "lottery_scam", weight: 28, category: "financial_lure" },
  { pattern: /₹\s*\d+\s*(lakh|crore|thousand)/i, label: "large_amount_promise", weight: 20, category: "financial_lure" },
  { pattern: /\$\s*\d{4,}/i, label: "large_usd_amount", weight: 15, category: "financial_lure" },

  // Bank / authority impersonation
  { pattern: /\bsbi\b|\bhdfc\b|\bicici\b|\baxis bank\b|\bkotak\b/i, label: "bank_impersonation", weight: 25, category: "impersonation" },
  { pattern: /\brbi\b|\bsebi\b|\bincome tax\b|\bcbi\b/i, label: "authority_impersonation", weight: 30, category: "impersonation" },
  { pattern: /your account (has been|will be|is) (blocked|suspended|frozen|deactivated)/i, label: "account_threat", weight: 30, category: "impersonation" },
  { pattern: /kyc (update|pending|expired|required)/i, label: "fake_kyc", weight: 28, category: "impersonation" },

  // Malicious links
  { pattern: /click (here|this link|below)/i, label: "click_bait", weight: 15, category: "phishing_link" },
  { pattern: /https?:\/\/\S*(free|win|prize|lucky|claim|verify|secure)\S*/i, label: "suspicious_url", weight: 30, category: "phishing_link" },
  { pattern: /bit\.ly|tinyurl|shorturl|t\.co\/[^twitter]/i, label: "url_shortener", weight: 20, category: "phishing_link" },

  // Remote access / device compromise
  { pattern: /install (this app|anydesk|teamviewer|remote)/i, label: "remote_access", weight: 40, category: "device_compromise" },
  { pattern: /download (this|the) (app|file|link|apk)/i, label: "download_request", weight: 25, category: "device_compromise" },
  { pattern: /allow (access|permission|screen sharing)/i, label: "access_permission", weight: 30, category: "device_compromise" },
];

const SAFE_SIGNALS = [
  /^\s*hi\b/i,
  /thank you/i,
  /have a nice day/i,
  /meeting (scheduled|at|tomorrow)/i,
];

/**
 * Analyze a message for scam signals.
 * @param {string} message
 * @returns {{ score: number, level: string, signals: Array, category: string|null, summary: string }}
 */
const analyzeMessage = (message) => {
  if (!message || typeof message !== "string") {
    return { score: 0, level: "safe", signals: [], category: null, summary: "Empty or invalid message" };
  }

  const text = message.trim();
  const detected = [];
  let score = 0;
  const categoryHits = {};

  for (const { pattern, label, weight, category } of SIGNAL_PATTERNS) {
    if (pattern.test(text)) {
      detected.push({ signal: label, weight, category });
      score += weight;
      categoryHits[category] = (categoryHits[category] || 0) + weight;
    }
  }

  // Reduce score if safe signals present
  const hasSafeSignals = SAFE_SIGNALS.some((p) => p.test(text));
  if (hasSafeSignals && score < 30) {
    score = Math.max(0, score - 10);
  }

  // Boost score if message is very short and contains a link (phishing SMS pattern)
  if (text.length < 160 && /https?:\/\//i.test(text) && score > 0) {
    score += 10;
  }

  // Cap
  score = Math.min(score, 100);

  const level = score >= 70 ? "scam"
    : score >= 40 ? "suspicious"
    : score >= 15 ? "caution"
    : "safe";

  // Dominant category
  const dominantCategory = Object.entries(categoryHits).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const summaries = {
    scam: "High-confidence scam detected. Multiple fraud signals identified.",
    suspicious: "Message shows suspicious patterns consistent with scam attempts.",
    caution: "Minor risk signals detected. Proceed with caution.",
    safe: "No significant scam signals detected.",
  };

  logger.info("Message analyzed", { score, level, signalCount: detected.length, category: dominantCategory });

  return {
    score,
    level,
    signals: detected,
    category: dominantCategory,
    summary: summaries[level],
  };
};

module.exports = { analyzeMessage };
