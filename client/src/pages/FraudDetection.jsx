import { useState, useEffect } from 'react';
import { fraudApi } from '../services/api';
import { getErrorMessage, riskColor, riskLabel, formatCurrency } from '../utils/helpers';
import TransactionTable from '../components/TransactionTable';

export default function FraudDetection() {
  const [formData, setFormData] = useState({ amount: '', location: '', device: '', merchantCategory: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fraudApi.history(10);
      setHistory(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fraudApi.analyze(formData);
      setResult(res.data.data);
      setFormData({ amount: '', location: '', device: '', merchantCategory: '' });
      fetchHistory(); // Refresh table
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Transaction Fraud Detection</h1>
        <p>Run real-time risk analysis on transaction attributes.</p>
      </div>

      <div className="grid-2">
        {/* FORM */}
        <div className="card">
          <h3 className="chart-title" style={{ marginBottom: 20 }}>New Transaction</h3>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Amount (INR)</label>
              <input 
                type="number" 
                name="amount"
                min="0"
                step="0.01"
                className="form-input" 
                required
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 5000"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                name="location"
                className="form-input" 
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Mumbai, India"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <input 
                type="text" 
                name="device"
                className="form-input" 
                required
                value={formData.device}
                onChange={handleChange}
                placeholder="e.g. iPhone 14 Pro, Unknown Android"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Merchant Category (Optional)</label>
              <input 
                type="text" 
                name="merchantCategory"
                className="form-input"
                value={formData.merchantCategory}
                onChange={handleChange}
                placeholder="e.g. Electronics, Crypto, Grocery"
              />
            </div>
            
            <button type="submit" className="form-btn" disabled={loading} style={{ marginTop: 10 }}>
              {loading ? <div className="spinner"></div> : 'Analyze Risk'}
            </button>
          </form>
        </div>

        {/* RESULT */}
        <div>
          {result ? (
            <div className={`result-box ${result.isFraud ? 'danger' : 'success'}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24 }}>{riskLabel(result.riskLevel)}</h2>
                <span className="badge" style={{ background: 'var(--bg-elevated)', fontSize: 16 }}>
                  Score: {result.riskScore}%
                </span>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <span>AI Confidence</span>
                  <span>{Math.round(result.aiConfidence * 100)}%</span>
                </div>
                <div className="risk-bar-track">
                  <div className="risk-bar-fill" style={{ width: `${result.aiConfidence * 100}%`, background: 'var(--accent)' }}></div>
                </div>
              </div>

              {result.signals && result.signals.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Detected Signals</div>
                  <div className="signal-list">
                    {result.signals.map((sig, i) => (
                      <span key={i} className="signal-tag">{sig}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', height: '100%' }}>
              <FaShieldAlt className="empty-icon" />
              <h3>Awaiting Analysis</h3>
              <p>Submit a transaction to view risk scoring details.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <TransactionTable transactions={history} />
      </div>
    </div>
  );
}