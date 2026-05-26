import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { fraudService } from "../services/api";
import { FaShieldAlt, FaSpinner, FaInfoCircle, FaEnvelopeOpenText } from "react-icons/fa";

function ScamAnalyzer() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyzeMessage = async (e) => {
    e.preventDefault();
    if (!message || message.trim().length < 5) {
      setError("Please paste a message that is at least 5 characters long.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fraudService.analyzeMessage(message);
      setResult(response.analysis);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLevelClass = (level) => {
    switch (level) {
      case "scam":
        return "badge-critical";
      case "suspicious":
        return "badge-high";
      case "caution":
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
          <h1>Phishing & Scam NLP Analyzer</h1>
          <p>Scan incoming SMS messages, emails, or chat transcripts for social engineering patterns.</p>
        </div>

        <div className="sandbox-grid">
          <form className="fraud-form-card" onSubmit={analyzeMessage}>
            <h2>Message Text Intake</h2>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Raw Message Content</label>
              <textarea
                placeholder="Paste the suspicious SMS, OTP request, or email body here..."
                rows="8"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <span className="input-hint">Minimum 5 characters. Standard limits up to 5000 characters.</span>
            </div>

            <button type="submit" disabled={loading} className="sim-submit-btn">
              {loading ? (
                <>
                  <FaSpinner className="icon-spin" /> Performing NLP Vector Checks...
                </>
              ) : (
                <>
                  <FaShieldAlt /> Inspect Message content
                </>
              )}
            </button>
          </form>

          {/* NLP Results */}
          <div className="sandbox-results-panel">
            {result ? (
              <div className="threat-summary-card">
                <div className="threat-summary-header">
                  <h3>NLP Assessment</h3>
                  <span className={`threat-badge ${getLevelClass(result.level)}`}>
                    {result.level.toUpperCase()}
                  </span>
                </div>

                <div className="threat-score-ring">
                  <div className="score-val">{result.score}</div>
                  <div className="score-lbl">Scam Score (0-100)</div>
                </div>

                <div className="threat-description-box">
                  <FaInfoCircle className="desc-info-icon" />
                  <p>{result.summary}</p>
                </div>

                <div className="threat-details-list">
                  <div className="detail-item">
                    <span>Threat Domain</span>
                    <span className="font-semibold text-capitalize">
                      {result.category || "General Classification"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span>Model Version</span>
                    <span className="font-mono text-sm">{result.modelVersion || "local-nlp-v1"}</span>
                  </div>
                </div>

                {result.signals && result.signals.length > 0 && (
                  <div className="threat-factors-section">
                    <h4>Triggered Phishing Markers</h4>
                    <div className="factors-scroller">
                      {result.signals.map((sig, idx) => (
                        <div key={idx} className="factor-pill">
                          <div className="factor-pill-info">
                            <span className="factor-name">{sig.signal.replace(/_/g, " ")}</span>
                            <span className="factor-category-tag">{sig.category}</span>
                          </div>
                          <span className="factor-weight">+{sig.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="sandbox-empty-state">
                <FaEnvelopeOpenText />
                <p>Waiting for message feed intake.</p>
                <span>Paste communication logs into the form to inspect phishing indicators.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScamAnalyzer;