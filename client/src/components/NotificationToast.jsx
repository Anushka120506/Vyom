import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "../services/api";
import {
  FaTimes,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBug,
} from "react-icons/fa";

function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewAlert = (alert) => {
      const id = Date.now() + Math.random().toString(36).substr(2, 5);
      const newToast = {
        id,
        type: alert.type,
        severity: alert.severity || "medium",
        title: alert.title,
        description: alert.description,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5

      // Auto close after 6 seconds
      setTimeout(() => {
        removeToast(id);
      }, 6000);
    };

    socket.on("alert:new", handleNewAlert);

    return () => {
      socket.off("alert:new", handleNewAlert);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "critical":
        return { border: "1px solid #ef4444", bg: "#1f1212" };
      case "high":
        return { border: "1px solid #f97316", bg: "#1f1712" };
      case "medium":
        return { border: "1px solid #eab308", bg: "#1e1e12" };
      default:
        return { border: "1px solid #3b82f6", bg: "#12171f" };
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "fraud_transaction":
        return <FaExclamationTriangle className="toast-icon-warning" />;
      case "scam_message":
        return <FaShieldAlt className="toast-icon-scam" />;
      default:
        return <FaBug className="toast-icon-generic" />;
    }
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = getSeverityStyles(toast.severity);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 150, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                borderLeft: `4px solid ${
                  toast.severity === "critical"
                    ? "#ef4444"
                    : toast.severity === "high"
                    ? "#f97316"
                    : toast.severity === "medium"
                    ? "#eab308"
                    : "#3b82f6"
                }`,
                background: styles.bg,
                borderColor: styles.border,
              }}
              className="toast-card"
            >
              <div className="toast-body">
                <div className="toast-icon-box">{getToastIcon(toast.type)}</div>
                <div className="toast-details">
                  <h4 className="toast-title">{toast.title}</h4>
                  <p className="toast-desc">{toast.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="toast-close-btn"
              >
                <FaTimes />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default NotificationToast;
