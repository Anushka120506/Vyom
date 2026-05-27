import { useState, useEffect } from 'react';
import { scamApi } from '../services/api';
import { getErrorMessage, riskColor, riskLabel, formatDate } from '../utils/helpers';
import { FaCommentDots } from 'react-icons/fa';

export default function ScamAnalyzer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await scamApi.history(10);
      setHistory(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await scamApi.analyze({ content });
      setResult(res.data.data);
      setContent('');
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
        <h1>NLP Scam Analyzer</h1>
        <p>Use Natural Language Processing to detect phishing and scam messages.</p>
      </div>

      <div className="grid-2">
        {/* FORM */}
        <div className="card">
          <h3 className="chart-title" style={{ marginBottom: 20 }}>Scan Message</h3>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea 
                className="form-input form-textarea" 
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste suspicious SMS, email, or WhatsApp message here..."
              />
            </div>
            
            <button type="submit" className="form-btn" disabled={loading || !content.trim()} style={{ marginTop: 10 }}>
              {loading ? <div className="spinner"></div> : 'Analyze Message'}
            </button>
          </form>
        </div>

        {/* RESULT */}
        <div>
          {result ? (
            <div className={`result-box ${result.isScam ? 'danger' : 'success'}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24 }}>{riskLabel(result.riskLevel)}</h2>
                <span className="badge" style={{ background: 'var(--bg-elevated)', fontSize: 16 }}>
                  Score: {result.riskScore}%
                </span>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <span>AI NLP Confidence</span>
                  <span>{Math.round(result.aiConfidence * 100)}%</span>
                </div>
                <div className="risk-bar-track">
                  <div className="risk-bar-fill" style={{ width: `${result.aiConfidence * 100}%`, background: 'var(--accent)' }}></div>
                </div>
              </div>

              {result.categories && result.categories.length > 0 && result.categories[0] !== 'safe' && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Threat Categories</div>
                  <div className="signal-list">
                    {result.categories.map((cat, i) => (
                      <span key={i} className="signal-tag" style={{ borderStyle: 'dashed' }}>
                        {cat.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.signals && result.signals.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Detected Patterns</div>
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
              <FaCommentDots className="empty-icon" />
              <h3>Awaiting Analysis</h3>
              <p>Submit a message to view NLP threat vectors.</p>
            </div>
          )}
        </div>
      </div>

      {/* HISTORY */}
      <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 16px' }}>
          <h3 className="chart-title">Recent Scans</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No recent scans found.</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th style={{ width: '40%' }}>Snippet</th>
                  <th>Categories</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td>{formatDate(h.createdAt)}</td>
                    <td>
                      <div style={{ 
                        maxWidth: 300, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        color: 'var(--text-primary)'
                      }}>
                        {h.content}
                      </div>
                    </td>
                    <td>
                      <div className="signal-list" style={{ marginTop: 0 }}>
                        {h.categories.slice(0, 2).map((c, i) => (
                          <span key={i} className="signal-tag" style={{ padding: '2px 6px', fontSize: 10 }}>
                            {c.replace('_', ' ')}
                          </span>
                        ))}
                        {h.categories.length > 2 && <span className="signal-tag" style={{ padding: '2px 6px', fontSize: 10 }}>+{h.categories.length - 2}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="risk-bar-wrap" style={{ width: 80 }}>
                        <div className="risk-bar-label">
                          <span>{h.riskScore}%</span>
                        </div>
                        <div className="risk-bar-track">
                          <div 
                            className="risk-bar-fill" 
                            style={{ 
                              width: `${h.riskScore}%`,
                              background: riskColor(h.riskLevel)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge`} style={{ 
                        color: riskColor(h.riskLevel),
                        background: `${riskColor(h.riskLevel)}15`
                      }}>
                        {riskLabel(h.riskLevel)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}