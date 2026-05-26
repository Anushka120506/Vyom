const { body } = require("express-validator");
const axios = require("axios");
const { analyzeMessage } = require("../services/scamAnalyzer");
const Alert = require("../models/Alert");
const { validate } = require("../middleware/validate");
const logger = require("../config/logger");

const analyzeValidation = [
  body("message")
    .trim()
    .isLength({ min: 5, max: 5000 })
    .withMessage("Message must be between 5 and 5000 characters"),
  validate,
];

const analyzeScamMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // 1. Local pattern matching
    const localResult = analyzeMessage(message);

    let finalScore = localResult.score;
    let finalLevel = localResult.level;
    let finalCategory = localResult.category;
    let finalSummary = localResult.summary;
    let finalSignals = [...localResult.signals];

    // 2. Fetch ML classification from Python AI engine
    const aiEngineUrl = process.env.AI_ENGINE_URL;
    if (aiEngineUrl) {
      try {
        logger.info("Calling Python AI Engine for message classification", { url: `${aiEngineUrl}/api/score/message` });
        const response = await axios.post(
          `${aiEngineUrl}/api/score/message`,
          { message },
          { timeout: 3000 } // 3 second fail-safe timeout
        );

        if (response.data && typeof response.data.score === "number") {
          const modelScore = response.data.score;
          // Weighted blending: 60% rules, 40% ML
          finalScore = Math.round(0.6 * localResult.score + 0.4 * modelScore);
          finalScore = Math.min(finalScore, 100);

          finalLevel = finalScore >= 70 ? "scam"
            : finalScore >= 40 ? "suspicious"
            : finalScore >= 15 ? "caution"
            : "safe";

          if (response.data.signals) {
            response.data.signals.forEach((sig) => {
              finalSignals.push({
                signal: `ai_${sig.signal}`,
                weight: sig.weight,
                category: `[ML] ${sig.category}`,
              });
            });
          }

          if (response.data.category) {
            finalCategory = response.data.category;
          }

          if (response.data.summary && (finalLevel === "scam" || finalLevel === "suspicious")) {
            finalSummary = response.data.summary;
          }
        }
      } catch (err) {
        logger.warn("AI Engine message scoring failed or timed out — using rules engine only", { error: err.message });
      }
    }

    const result = {
      score: finalScore,
      level: finalLevel,
      signals: finalSignals,
      category: finalCategory,
      summary: finalSummary,
      modelVersion: aiEngineUrl ? "blended-nlp-v1" : "local-nlp-v1",
    };


    // Persist high-confidence scam detections as alerts
    if (result.level === "scam" || result.level === "suspicious") {
      const alert = await Alert.create({
        type: "scam_message",
        severity: result.level === "scam" ? "high" : "medium",
        title: `Scam message detected — ${result.category || "general"}`,
        description: result.summary,
        userId,
        metadata: {
          score: result.score,
          signals: result.signals,
          category: result.category,
          messagePreview: message.substring(0, 200),
        },
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${userId}`).emit("alert:new", alert);
      }
    }

    logger.info("Scam analysis completed", {
      userId,
      score: result.score,
      level: result.level,
      signalCount: result.signals.length,
    });

    res.json({ analysis: result });
  } catch (err) {
    next(err);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const userId = req.user._id;

    const filter = { userId };
    if (unreadOnly === "true") filter.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("relatedTransactionId", "txnId amount status")
        .lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const markAlertRead = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ alert });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeScamMessage, getAlerts, markAlertRead, analyzeValidation };
