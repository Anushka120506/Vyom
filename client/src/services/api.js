import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: API_URL,
});

// Automatically inject JWT token into header
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vyom_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global WebSocket connection instance
let socket = null;

export const initiateSocketConnection = (userId) => {
  if (socket) return socket;
  socket = io(API_URL, {
    withCredentials: true,
  });
  if (userId) {
    socket.emit("join:user", userId);
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// API Services
export const authService = {
  login: async (email, password) => {
    const res = await API.post("/api/auth/login", { email, password });
    if (res.data.token) localStorage.setItem("vyom_token", res.data.token);
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await API.post("/api/auth/register", { name, email, password });
    if (res.data.token) localStorage.setItem("vyom_token", res.data.token);
    return res.data;
  },
  getMe: async () => {
    const res = await API.get("/api/auth/me");
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("vyom_token");
    disconnectSocket();
  },
};

export const transactionService = {
  getStats: async () => {
    const res = await API.get("/api/transactions/stats/dashboard");
    return res.data;
  },
  list: async (params = {}) => {
    const res = await API.get("/api/transactions", { params });
    return res.data;
  },
  submit: async (amount, location, deviceType, merchantCategory) => {
    const res = await API.post("/api/transactions", {
      amount,
      location,
      deviceType,
      merchantCategory,
    });
    return res.data;
  },
};

export const fraudService = {
  analyzeMessage: async (message) => {
    const res = await API.post("/api/fraud/analyze", { message });
    return res.data;
  },
  getAlerts: async (params = {}) => {
    const res = await API.get("/api/fraud/alerts", { params });
    return res.data;
  },
  markRead: async (id) => {
    const res = await API.patch(`/api/fraud/alerts/${id}/read`);
    return res.data;
  },
};

export default API;

