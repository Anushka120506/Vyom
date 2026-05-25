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
    <div className="table-container">
      <h2>Recent Transactions</h2>

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

              <td>{item.status}</td>

              <td>{item.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;