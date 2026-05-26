/**
 * Fraud scoring engine — rule-based + heuristic risk analysis.
 *
 * This engine operates independently of the Python AI model and provides
 * deterministic, explainable risk scoring for every transaction.
 * When the Python model is available, its score is blended in.
 */

const logger = require("../config/logger");

// Known high-risk country codes / location patterns
const HIGH_RISK_LOCATIONS = [
  "nigeria", "ghana", "cameroon", "ivory coast", "senegal",
  "pakistan", "afghanistan", "iran", "north korea",
  "anonymous", "vpn", "proxy", "tor",
];

// Merchant categories associated with elevated fraud
const HIGH_RISK_MERCHANTS = [
  "crypto", "gambling", "casino", "forex", "wire transfer",
  "money transfer", "prepaid", "gift card", "digital goods",
];

// Time windows considered off-hours (22:00 - 05:00)
const isOffHours = (date) => {
  const hour = new Date(date).getHours();
  return hour >= 22 || hour <= 5;
};

/**
 * Analyze a transaction and return a risk assessment.
 * @param {Object} txnData
 * @param {number}  txnData.amount
 * @param {string}  txnData.location
 * @param {string}  txnData.deviceType
 * @param {string}  [txnData.merchantCategory]
 * @param {string}  [txnData.ipAddress]
 * @param {Date}    [txnData.timestamp]
 * @param {Array}   [txnData.recentTxns] - last N txns by same user for velocity check
 * @returns {{ score: number, level: string, factors: Array, recommendation: string }}
 */
const analyzeTransaction = (txnData) => {
  const {
    amount,
    location = "",
    deviceType = "unknown",
    merchantCategory = "",
    ipAddress = "",
    timestamp = new Date(),
    recentTxns = [],
  } = txnData;

  const factors = [];
  let score = 0;

  // --- Amount-based scoring ---
  if (amount > 50000) {
    score += 35;
    factors.push({ factor: "very_large_amount", weight: 35, description: `Transaction amount ₹${amount.toLocaleString()} exceeds safe threshold` });
  } else if (amount > 10000) {
    score += 20;
    factors.push({ factor: "large_amount", weight: 20, description: `Transaction amount ₹${amount.toLocaleString()} is above average` });
  } else if (amount > 5000) {
    score += 10;
    factors.push({ factor: "elevated_amount", weight: 10, description: `Transaction amount is moderately elevated` });
  }

  // --- Location-based scoring ---
  const locationLower = location.toLowerCase();
  const isHighRiskLocation = HIGH_RISK_LOCATIONS.some((loc) =>
    locationLower.includes(loc)
  );
  if (isHighRiskLocation) {
    score += 30;
    factors.push({ factor: "high_risk_location", weight: 30, description: `Location "${location}" is associated with elevated fraud activity` });
  }

  // --- Device risk ---
  if (deviceType === "unknown") {
    score += 15;
    factors.push({ factor: "unknown_device", weight: 15, description: "Transaction originated from an unrecognized device type" });
  }

  // --- Merchant category risk ---
  const merchantLower = merchantCategory.toLowerCase();
  const isHighRiskMerchant = HIGH_RISK_MERCHANTS.some((cat) =>
    merchantLower.includes(cat)
  );
  if (isHighRiskMerchant) {
    score += 25;
    factors.push({ factor: "high_risk_merchant", weight: 25, description: `Merchant category "${merchantCategory}" has elevated fraud association` });
  }

  // --- Off-hours transaction ---
  if (isOffHours(timestamp)) {
    score += 10;
    factors.push({ factor: "off_hours", weight: 10, description: "Transaction was initiated during unusual hours (10PM – 5AM)" });
  }

  // --- Velocity check (rapid successive transactions) ---
  if (recentTxns.length >= 3) {
    const window = 5 * 60 * 1000; // 5 minutes
    const now = new Date(timestamp).getTime();
    const rapidTxns = recentTxns.filter((t) => {
      const age = now - new Date(t.createdAt).getTime();
      return age <= window;
    });
    if (rapidTxns.length >= 3) {
      score += 20;
      factors.push({ factor: "velocity_spike", weight: 20, description: `${rapidTxns.length} transactions in 5 minutes — velocity anomaly detected` });
    }
  }

  // --- IP-based signals ---
  if (ipAddress && (ipAddress.startsWith("10.") || ipAddress === "127.0.0.1")) {
    // internal — no risk signal
  } else if (!ipAddress) {
    score += 5;
    factors.push({ factor: "missing_ip", weight: 5, description: "No IP address captured for this transaction" });
  }

  // Cap at 100
  score = Math.min(score, 100);

  const level = score >= 75 ? "critical"
    : score >= 50 ? "high"
    : score >= 25 ? "medium"
    : "low";

  const recommendation = score >= 75 ? "block"
    : score >= 50 ? "flag_for_review"
    : score >= 25 ? "monitor"
    : "approve";

  logger.info("Transaction analyzed", {
    score,
    level,
    factorCount: factors.length,
    recommendation,
  });

  return { score, level, factors, recommendation };
};

/**
 * Blend a model score from the Python AI engine with the rule-based score.
 * Weighted 40% model / 60% rules — rules are more explainable.
 */
const blendWithModelScore = (rulesScore, modelScore) => {
  if (modelScore == null) return rulesScore;
  return Math.round(0.6 * rulesScore + 0.4 * modelScore);
};

module.exports = { analyzeTransaction, blendWithModelScore };
