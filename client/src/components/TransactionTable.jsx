import { motion } from "framer-motion";

function TransactionTable() {
  const transactions = [
    {
      id: "#TXN1021",
      amount: "$1200",
      status: "Blocked",
      risk: "High",
    },

    {
      id: "#TXN2045",
      amount: "$850",
      status: "Safe",
      risk: "Low",
    },

    {
      id: "#TXN7781",
      amount: "$4300",
      status: "Blocked",
      risk: "Critical",
    },

    {
      id: "#TXN5522",
      amount: "$640",
      status: "Monitoring",
      risk: "Medium",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="table-container"
    >
      <div className="table-header">
        <h2>Recent Transactions</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Risk Level</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((item, index) => (
            <tr key={index}>
              <td>{item.id}</td>

              <td>{item.amount}</td>

              <td>
                <span className="status-chip">
                  {item.status}
                </span>
              </td>

              <td>{item.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

export default TransactionTable;