import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { transactionService } from "../services/api";
import { FaShieldAlt, FaSpinner, FaHistory } from "react-icons/fa";

function FraudDetection() {
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState("desktop");
  const [merchantCategory, setMerchantCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !location) {
      setError("Amount and Location are required fields.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await transactionService.submit(
        parseFloat(amount),
        location,
        device,
        merchantCategory
      );
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please verify parameters.");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (level) => {
    switch (level) {
      case "critical":
        return "badge-critical";
      case "high":
        return "badge-high";
      case "medium":
        return "badge-medium";
      default:
        return "badge-low";
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Fraud Detection Sandbox</h1>
          <p>Test the rules and ML scoring engine by simulating live transaction requests.</p>
        </div>

        <div className="sandbox-grid">
          <form className="fraud-form-card" onSubmit={handleSubmit}>
            <h2>Simulation Parameters</h2>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Transaction Location / Country</label>
              <input
                type="text"
                placeholder="e.g. Nigeria, India, VPN"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Device Origin Type</label>
              <select value={device} onChange={(e) => setDevice(e.target.value)}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile Phone</option>
                <option value="tablet">Tablet</option>
                <option value="unknown">Unknown / Private OS</option>
              </select>
            </div>

            <div className="form-group">
              <label>Merchant Category (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Crypto, Gambling, Retail"
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="sim-submit-btn">
              {loading ? (
                <>
                  <FaSpinner className="icon-spin" /> Simulating Ledger Scoring...
                </>
              ) : (
                <>
                  <FaShieldAlt /> Analyze Transaction Risk
                </>
              )}
            </button>
          </form>

          {/* Results Output */}
          <div className="sandbox-results-panel">
            {result ? (
              <div className="threat-summary-card">
                <div className="threat-summary-header">
                  <h3>Scoring Assessment</h3>
                  <span className={`threat-badge ${getBadgeClass(result.analysis.level)}`}>
                    {result.analysis.recommendation.toUpperCase()}
                  </span>
                </div>

                <div className="threat-score-ring">
                  <div className="score-val">{result.analysis.score}</div>
                  <div className="score-lbl">Risk Score (0-100)</div>
                </div>

                <div className="threat-details-list">
                  <div className="detail-item">
                    <span>Transaction ID</span>
                    <span className="font-mono">{result.transaction.txnId}</span>
                  </div>
                  <div className="detail-item">
                    <span>Baseline Score</span>
                    <span>{result.analysis.level.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span>Final Outcome</span>
                    <span className="font-semibold text-capitalize">{result.transaction.status}</span>
                  </div>
                </div>

                {result.analysis.factors && result.analysis.factors.length > 0 && (
                  <div className="threat-factors-section">
                    <h4>Identified Risk Signals</h4>
                    <div className="factors-scroller">
                      {result.analysis.factors.map((factor, idx) => (
                        <div key={idx} className="factor-pill">
                          <span className="factor-name">{factor.description}</span>
                          <span className="factor-weight">+{factor.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="sandbox-empty-state">
                <FaHistory />
                <p>Waiting for transaction execution trigger.</p>
                <span>Complete the simulation parameters form to run scoring.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FraudDetection;