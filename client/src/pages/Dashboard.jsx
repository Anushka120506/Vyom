import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import RiskCard from "../components/RiskCard";
import FraudChart from "../components/FraudChart";
import TransactionTable from "../components/TransactionTable";
import { transactionService, getSocket } from "../services/api";

import {
  FaShieldAlt,
  FaCreditCard,
  FaExclamationTriangle,
  FaRobot,
} from "react-icons/fa";

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await transactionService.getStats();
      setData(res);
      setError("");
    } catch (err) {
      setError("Failed to fetch real-time dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Hook WebSocket to auto-refresh stats when new alarms are generated
    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => {
        fetchStats();
      };
      socket.on("alert:new", handleRefresh);
      socket.on("fraud:detected", handleRefresh);

      return () => {
        socket.off("alert:new", handleRefresh);
        socket.off("fraud:detected", handleRefresh);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content dashboard-loader-box">
          <div className="spinner"></div>
          <p>Processing ledger details...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalTransactions: 0,
    blockedTransactions: 0,
    highRiskTransactions: 0,
    blockRate: 0,
    unreadAlerts: 0,
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-title-row">
            <h1>Analyst Hub</h1>
            {user && (
              <span className="analyst-tag">
                Analyst Profile: {user.name} ({user.role})
              </span>
            )}
          </div>
          <p>Real-time telemetry, transaction risk assessment, and system telemetry.</p>
        </div>

        {error && <div className="dashboard-error-banner">{error}</div>}

        <div className="dashboard-grid">
          <RiskCard
            title="Total Handled"
            value={stats.totalTransactions}
            status="Processed Transactions"
            icon={<FaCreditCard />}
          />

          <RiskCard
            title="Threat Alarms"
            value={stats.unreadAlerts}
            status="Active Unread Alerts"
            icon={<FaExclamationTriangle />}
            highlight={stats.unreadAlerts > 0}
          />

          <RiskCard
            title="Block Actions"
            value={stats.blockedTransactions}
            status={`Protection Ratio: ${stats.blockRate}%`}
            icon={<FaShieldAlt />}
          />

          <RiskCard
            title="Severe Risk Logs"
            value={stats.highRiskTransactions}
            status="Scored Above 50/100"
            icon={<FaRobot />}
          />
        </div>

        <div className="dashboard-visuals">
          <FraudChart trendData={data?.trend || []} />
          <TransactionTable transactions={data?.recentActivity || []} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;