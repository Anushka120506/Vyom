const express = require("express");
const router = express.Router();
const {
  submitTransaction,
  getTransactions,
  getTransactionById,
  getDashboardStats,
  submitValidation,
} = require("../controllers/transactionController");
const { authenticate } = require("../middleware/auth");
const { analysisLimiter } = require("../middleware/rateLimiter");

router.use(authenticate);

router.get("/stats/dashboard", getDashboardStats);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.post("/", analysisLimiter, submitValidation, submitTransaction);

module.exports = router;
