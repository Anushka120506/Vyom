import { formatCurrency, formatDate, riskColor, riskLabel } from '../utils/helpers';

export default function TransactionTable({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="card">
        <h3 className="chart-title">Recent Transactions</h3>
        <div className="empty-state">
          <p>No transactions found. Try running an analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px 24px 16px' }}>
        <h3 className="chart-title">Recent Transactions</h3>
      </div>
      
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Location</th>
              <th>Device</th>
              <th>Risk Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td>{formatDate(t.createdAt)}</td>
                <td style={{ fontWeight: 500 }}>{formatCurrency(t.amount)}</td>
                <td>{t.location}</td>
                <td>{t.device}</td>
                <td>
                  <div className="risk-bar-wrap" style={{ width: 100 }}>
                    <div className="risk-bar-label">
                      <span>{t.riskScore}%</span>
                    </div>
                    <div className="risk-bar-track">
                      <div 
                        className="risk-bar-fill" 
                        style={{ 
                          width: `${t.riskScore}%`,
                          background: riskColor(t.riskLevel)
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge`} style={{ 
                    color: riskColor(t.riskLevel),
                    background: `${riskColor(t.riskLevel)}15`
                  }}>
                    {t.isFraud ? 'Flagged' : riskLabel(t.riskLevel)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}