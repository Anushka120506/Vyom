import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.user._id,
    });

    // Join user-specific room for targeted alerts
    socket.join(`user:${socket.user._id}`);

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.user._id,
        reason,
      });
    });

    socket.on('error', (err) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.user._id,
        error: err.message,
      });
    });
  });

  return io;
}

// Emit fraud alert to specific user room
export function emitFraudAlert(io, userId, alertData) {
  io.to(`user:${userId}`).emit('fraud:alert', alertData);
}

export function emitScamAlert(io, userId, alertData) {
  io.to(`user:${userId}`).emit('scam:alert', alertData);
}
