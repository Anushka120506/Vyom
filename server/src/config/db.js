import mongoose from 'mongoose';
import logger from './logger.js';

let retryCount = 0;
const MAX_RETRIES = 5;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not defined in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0;
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  } catch (err) {
    retryCount++;
    logger.error('MongoDB connection failed', {
      attempt: retryCount,
      maxRetries: MAX_RETRIES,
      error: err.message,
    });

    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      setTimeout(connectDB, delay);
    } else {
      logger.error('Max MongoDB retries reached. Shutting down.');
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
