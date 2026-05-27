import { useState, useEffect } from 'react';
import { dashboardApi, fraudApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getErrorMessage } from '../utils/helpers';
import RiskCard from '../components/RiskCard';
import FraudChart from '../components/FraudChart';
import TransactionTable from '../components/TransactionTable';
import { FaShieldAlt, FaCreditCard, FaExclamationTriangle, FaRobot } from 'react-icons/fa';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const socket = useSocket();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        dashboardApi.stats(),
        fraudApi.history(10)
      ]);
      setStats(statsRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for real-time fraud alerts
    const handleFraudAlert = (data) => {
      // Re-fetch to get latest state
      fetchDashboard();
    };

    socket.on('fraud:alert', handleFraudAlert);
    
    return () => {
      socket.off('fraud:alert', handleFraudAlert);
    };
  }, [socket]);

  if (loading && !stats) {
    return (
      <div className="empty-state">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const { fraud, scam, weeklyTrend } = stats;

  return (
    <div>
      <div className="page-header">
        <h1>Fraud Analytics Dashboard</h1>
        <p>Monitor transaction risk and scam detection metrics in real-time.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <RiskCard
          title="Total Transactions"
          value={fraud.total}
          status="Processed"
          icon={<FaCreditCard />}
          color="var(--accent)"
        />
        <RiskCard
          title="Fraud Alerts"
          value={fraud.flagged}
          status="Flagged"
          icon={<FaExclamationTriangle />}
          color={fraud.flagged > 0 ? "var(--danger)" : "var(--success)"}
        />
        <RiskCard
          title="Average Risk"
          value={`${fraud.avgRiskScore}%`}
          status="System Health"
          icon={<FaShieldAlt />}
          color={fraud.avgRiskScore > 50 ? "var(--warning)" : "var(--success)"}
        />
        <RiskCard
          title="Scam Messages"
          value={scam.total}
          status={`${scam.flagged} Blocked`}
          icon={<FaRobot />}
          color="var(--accent)"
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <FraudChart data={weeklyTrend} />
      </div>

      <TransactionTable transactions={history} />
    </div>
  );
}