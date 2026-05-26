const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    status = 422;
    const fields = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    return res.status(status).json({ error: "Validation failed", fields });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
    return res.status(status).json({ error: message });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Don't leak internals in production
  if (status === 500 && process.env.NODE_ENV === "production") {
    logger.error("Unhandled server error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?._id,
    });
    message = "Something went wrong. Please try again later.";
  } else if (status === 500) {
    logger.error("Server error", { error: err.message, path: req.path });
  }

  res.status(status).json({ error: message });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFound };
