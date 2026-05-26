require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");

const connectDB = require("./config/db");
const logger = require("./config/logger");
const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const fraudRoutes = require("./routes/fraud");

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

const connectedUsers = new Map();

io.on("connection", (socket) => {
  logger.info("Socket connected", { socketId: socket.id });

  socket.on("join:user", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    connectedUsers.set(socket.id, userId);
    logger.info("User joined personal room", { userId, socketId: socket.id });
  });

  socket.on("join:analysts", () => {
    socket.join("analysts");
  });

  socket.on("disconnect", (reason) => {
    const userId = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    logger.info("Socket disconnected", { socketId: socket.id, userId, reason });
  });

  socket.on("error", (err) => {
    logger.error("Socket error", { socketId: socket.id, error: err.message });
  });
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// HTTP request logging (dev only — structured logs handle production)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Request timing
app.use((req, res, next) => {
  req._startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - req._startTime;
    if (duration > 1000) {
      logger.warn("Slow request detected", {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        status: res.statusCode,
      });
    }
  });
  next();
});

app.use("/api", apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/fraud", fraudRoutes);

// ── Error handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Boot ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`Vyom server running on port ${PORT}`, {
      env: process.env.NODE_ENV || "development",
      port: PORT,
    });
  });
};

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection", { error: err.message, stack: err.stack });
  httpServer.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
