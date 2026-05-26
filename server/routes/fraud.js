const express = require("express");
const router = express.Router();
const {
  analyzeScamMessage,
  getAlerts,
  markAlertRead,
  analyzeValidation,
} = require("../controllers/fraudController");
const { authenticate } = require("../middleware/auth");
const { analysisLimiter } = require("../middleware/rateLimiter");

router.use(authenticate);

router.post("/analyze", analysisLimiter, analyzeValidation, analyzeScamMessage);
router.get("/alerts", getAlerts);
router.patch("/alerts/:id/read", markAlertRead);

module.exports = router;
