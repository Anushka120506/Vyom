const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

const onLimitReached = (req, res, options) => {
  logger.warn("Rate limit exceeded", {
    ip: req.ip,
    path: req.path,
    userId: req.user?._id,
  });
};

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req, res);
    res.status(429).json({ error: "Too many requests, please slow down" });
  },
});

// Auth endpoint — tighter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req, res);
    res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
  },
});

// AI analysis endpoints — heavier operations
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req, res);
    res.status(429).json({ error: "Analysis rate limit reached. Please wait a moment." });
  },
});

module.exports = { apiLimiter, authLimiter, analysisLimiter };
