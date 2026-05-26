import { motion } from "framer-motion";

function TransactionTable({ transactions = [] }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "blocked":
        return "chip-blocked";
      case "monitoring":
        return "chip-monitoring";
      case "approved":
        return "chip-approved";
      default:
        return "chip-pending";
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "critical":
        return "text-critical";
      case "high":
        return "text-high";
      case "medium":
        return "text-medium";
      default:
        return "text-low";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="table-container"
    >
      <div className="table-header">
        <h2>Recent Transaction Logs</h2>
      </div>

      <div className="table-responsive-box">
        {transactions.length === 0 ? (
          <div className="empty-table-prompt">
            No transactions found. Submit a run using the Fraud Detection panel.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn Hash</th>
                <th>Created At</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk Score</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((txn, index) => (
                <tr key={txn._id || index}>
                  <td className="font-mono text-sm">{txn.txnId}</td>
                  <td>{new Date(txn.createdAt).toLocaleString()}</td>
                  <td className="font-semibold">₹{txn.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status-chip ${getStatusColor(txn.status)}`}>
                      {txn.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={`font-bold ${getRiskColor(txn.riskLevel)}`}>
                    {txn.riskScore}/100 ({txn.riskLevel})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

export default TransactionTable;