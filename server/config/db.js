const mongoose = require("mongoose");
const logger = require("./logger");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error("MONGODB_URI is not defined in environment");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info("MongoDB connected", { host: conn.connection.host });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB disconnected — will retry on next request");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error", { error: err.message });
    });
  } catch (err) {
    logger.error("Failed to connect to MongoDB", { error: err.message });
    process.exit(1);
  }
};

module.exports = connectDB;
