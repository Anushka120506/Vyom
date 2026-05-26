const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    txnId: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", "unknown"],
      default: "unknown",
    },
    merchantCategory: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "blocked", "monitoring"],
      default: "pending",
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical", null],
      default: null,
    },
    riskFactors: [
      {
        factor: String,
        weight: Number,
        description: String,
      },
    ],
    analysisResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ riskLevel: 1 });
transactionSchema.index({ txnId: 1 }, { unique: true });

transactionSchema.pre("save", function (next) {
  if (!this.txnId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.txnId = `TXN-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
