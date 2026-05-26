const { body } = require("express-validator");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");
const { analyzeTransaction, blendWithModelScore } = require("../services/fraudEngine");
const { validate } = require("../middleware/validate");
const logger = require("../config/logger");

const submitValidation = [
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
  body("location").trim().isLength({ min: 2 }).withMessage("Location is required"),
  body("deviceType")
    .optional()
    .isIn(["mobile", "desktop", "tablet", "unknown"])
    .withMessage("Invalid device type"),
  body("merchantCategory").optional().trim().isLength({ max: 100 }),
  validate,
];

const submitTransaction = async (req, res, next) => {
  try {
    const { amount, location, deviceType, merchantCategory } = req.body;
    const userId = req.user._id;

    // Fetch recent transactions for velocity check
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTxns = await Transaction.find({
      userId,
      createdAt: { $gte: fiveMinutesAgo },
    }).select("createdAt amount").lean();

    // 1. Run local deterministic rule-based analysis
    const localAnalysis = analyzeTransaction({
      amount: parseFloat(amount),
      location,
      deviceType: deviceType || "unknown",
      merchantCategory: merchantCategory || "",
      ipAddress: req.ip,
      timestamp: new Date(),
      recentTxns,
    });

    // 2. Fetch ML score from Python AI engine if configured
    let modelScore = null;
    let modelResult = null;
    const aiEngineUrl = process.env.AI_ENGINE_URL;

    if (aiEngineUrl) {
      try {
        logger.info("Calling Python AI Engine for transaction score", { url: `${aiEngineUrl}/api/score/transaction` });
        const response = await axios.post(
          `${aiEngineUrl}/api/score/transaction`,
          {
            amount: parseFloat(amount),
            location,
            deviceType: deviceType || "unknown",
            merchantCategory: merchantCategory || "",
          },
          { timeout: 3000 } // 3 second fail-safe timeout
        );

        if (response.data && typeof response.data.score === "number") {
          modelScore = response.data.score;
          modelResult = response.data;
        }
      } catch (err) {
        logger.warn("AI Engine transaction scoring failed or timed out — using rules engine only", { error: err.message });
      }
    }

    // 3. Blend local rule-based score with Python model score
    const finalScore = blendWithModelScore(localAnalysis.score, modelScore);

    const finalLevel = finalScore >= 75 ? "critical"
      : finalScore >= 50 ? "high"
      : finalScore >= 25 ? "medium"
      : "low";

    const finalRecommendation = finalScore >= 75 ? "block"
      : finalScore >= 50 ? "flag_for_review"
      : finalScore >= 25 ? "monitor"
      : "approve";

    const finalFactors = [...localAnalysis.factors];
    if (modelResult && modelResult.factors) {
      modelResult.factors.forEach((f) => {
        finalFactors.push({
          factor: `ai_${f.factor}`,
          weight: f.weight,
          description: `[ML Engine] ${f.description}`,
        });
      });
    }

    const analysis = {
      score: finalScore,
      level: finalLevel,
      recommendation: finalRecommendation,
      factors: finalFactors,
    };

    const statusMap = {
      approve: "approved",
      monitor: "monitoring",
      flag_for_review: "monitoring",
      block: "blocked",
    };

    const txn = await Transaction.create({
      amount: parseFloat(amount),
      location,
      deviceType: deviceType || "unknown",
      merchantCategory: merchantCategory || "",
      ipAddress: req.ip,
      userId,
      status: statusMap[analysis.recommendation] || "pending",
      riskScore: analysis.score,
      riskLevel: analysis.level,
      riskFactors: analysis.factors,
      analysisResult: analysis,
      analyzedAt: new Date(),
    });


    // Create alert for high-risk transactions
    if (analysis.level === "high" || analysis.level === "critical") {
      const alert = await Alert.create({
        type: "fraud_transaction",
        severity: analysis.level,
        title: `${analysis.level === "critical" ? "Critical" : "High"} risk transaction detected`,
        description: `Transaction ${txn.txnId} scored ${analysis.score}/100. ${analysis.factors.length} risk factor(s) identified.`,
        userId,
        relatedTransactionId: txn._id,
        metadata: { txnId: txn.txnId, riskScore: analysis.score, factors: analysis.factors },
      });

      // Emit real-time alert via socket if available
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${userId}`).emit("alert:new", alert);
        io.to("analysts").emit("fraud:detected", {
          txnId: txn.txnId,
          score: analysis.score,
          level: analysis.level,
          userId,
        });
      }
    }

    logger.info("Transaction submitted and analyzed", {
      txnId: txn.txnId,
      userId,
      riskScore: analysis.score,
      riskLevel: analysis.level,
      status: txn.status,
    });

    res.status(201).json({
      transaction: txn,
      analysis: {
        score: analysis.score,
        level: analysis.level,
        recommendation: analysis.recommendation,
        factors: analysis.factors,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, riskLevel } = req.query;
    const userId = req.user._id;

    const filter = { userId };
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
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

const getTransactionById = async (req, res, next) => {
  try {
    const txn = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ transaction: txn });
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, blocked, highRisk, byRiskLevel, recentActivity] = await Promise.all([
      Transaction.countDocuments({ userId }),
      Transaction.countDocuments({ userId, status: "blocked" }),
      Transaction.countDocuments({ userId, riskLevel: { $in: ["high", "critical"] } }),
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
      ]),
      Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("txnId amount status riskLevel riskScore createdAt")
        .lean(),
    ]);

    // Monthly fraud trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trend = await Transaction.aggregate([
      { $match: { userId, createdAt: { $gte: sixMonthsAgo }, riskLevel: { $in: ["high", "critical"] } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
          avgScore: { $avg: "$riskScore" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    byRiskLevel.forEach(({ _id, count }) => {
      if (_id && riskDistribution.hasOwnProperty(_id)) {
        riskDistribution[_id] = count;
      }
    });

    const alertCount = await Alert.countDocuments({ userId, isRead: false });

    res.json({
      stats: {
        totalTransactions: total,
        blockedTransactions: blocked,
        highRiskTransactions: highRisk,
        blockRate: total > 0 ? Math.round((blocked / total) * 100) : 0,
        unreadAlerts: alertCount,
      },
      riskDistribution,
      trend,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitTransaction,
  getTransactions,
  getTransactionById,
  getDashboardStats,
  submitValidation,
};
