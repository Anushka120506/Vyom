const express = require("express");
const router = express.Router();
const { register, login, getMe, registerValidation, loginValidation } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.get("/me", authenticate, getMe);

module.exports = router;
