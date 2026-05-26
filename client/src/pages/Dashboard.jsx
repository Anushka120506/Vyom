import Sidebar from "../components/Sidebar";
import RiskCard from "../components/RiskCard";
import FraudChart from "../components/FraudChart";
import TransactionTable from "../components/TransactionTable";

import {
  FaShieldAlt,
  FaCreditCard,
  FaExclamationTriangle,
  FaRobot,
} from "react-icons/fa";

function Dashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Fraud Analytics Dashboard</h1>

          <p>
            Monitor fraud activity and AI risk
            analysis in realtime.
          </p>
        </div>

        <div className="dashboard-grid">
          <RiskCard
            title="Fraud Alerts"
            value="128"
            status="High Risk Activity"
            icon={<FaExclamationTriangle />}
          />

          <RiskCard
            title="Blocked Transactions"
            value="64"
            status="Protected Successfully"
            icon={<FaCreditCard />}
          />

          <RiskCard
            title="Risk Score"
            value="92%"
            status="System Protection Active"
            icon={<FaShieldAlt />}
          />

          <RiskCard
            title="Scam Messages"
            value="245"
            status="AI Detection Running"
            icon={<FaRobot />}
          />
        </div>

        <FraudChart />

        <TransactionTable />
      </div>
    </div>
  );
}

export default Dashboard;