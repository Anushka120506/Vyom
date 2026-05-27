import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './src/config/db.js';
import logger from './src/config/logger.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { initSocket } from './src/socket/index.js';

import authRoutes from './src/routes/auth.js';
import fraudRoutes from './src/routes/fraud.js';
import scamRoutes from './src/routes/scam.js';
import dashboardRoutes from './src/routes/dashboard.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Global rate limit
app.use(globalLimiter);

// Health check (no auth, no logging)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/scam', scamRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// Init WebSocket
const io = initSocket(server);
app.set('io', io);

// Boot sequence
async function start() {
  await connectDB();

  server.listen(PORT, () => {
    logger.info(`Vyom API server running`, {
      port: PORT,
      env: process.env.NODE_ENV,
      pid: process.pid,
    });
  });
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
