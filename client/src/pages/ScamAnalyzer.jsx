import { useState } from "react";

function ScamAnalyzer() {
  const [message, setMessage] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!message.trim()) return;

    setLoading(true);

    setTimeout(() => {
      setResult({
        risk: "High",
        score: "92%",
        reason:
          "Suspicious urgency and phishing keywords detected.",
      });

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="page">
      <h1>Scam Message Analyzer</h1>

      <textarea
        placeholder="Paste suspicious message here..."
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        className="scam-textarea"
      />

      <button
        onClick={handleAnalyze}
        className="analyze-btn"
      >
        {loading
          ? "Analyzing..."
          : "Analyze Message"}
      </button>

      {result && (
        <div className="result-card">
          <h2>Analysis Result</h2>

          <p>
            <strong>Risk Level:</strong>{" "}
            {result.risk}
          </p>

          <p>
            <strong>Fraud Score:</strong>{" "}
            {result.score}
          </p>

          <p>
            <strong>Reason:</strong>{" "}
            {result.reason}
          </p>
        </div>
      )}
    </div>
  );
}

export default ScamAnalyzer;