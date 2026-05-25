import Sidebar from "../components/Sidebar";
import RiskCard from "../components/RiskCard";
import FraudChart from "../components/FraudChart";
import TransactionTable from "../components/TransactionTable";

function Dashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <h1>Fraud Analytics Dashboard</h1>

        <div className="dashboard-grid">
          <RiskCard
            title="Fraud Alerts"
            value="128"
            status="High Risk Activity"
          />

          <RiskCard
            title="Blocked Transactions"
            value="64"
            status="Protected Successfully"
          />

          <RiskCard
            title="Risk Score"
            value="92%"
            status="System Protection Active"
          />

          <RiskCard
            title="Scam Messages"
            value="245"
            status="AI Detection Running"
          />
        </div>

        <FraudChart />

        <TransactionTable />
      </div>
    </div>
  );
}

export default Dashboard;