import { useState } from "react";

function FraudDetection() {
  const [formData, setFormData] = useState({
    amount: "",
    receiver: "",
    transactionType: "",
  });

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setTimeout(() => {
      setResult({
        risk: "High",

        score: "89%",

        message:
          "Suspicious transaction pattern detected.",
      });

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="page">
      <h1>Fraud Detection System</h1>

      <form
        onSubmit={handleSubmit}
        className="fraud-form"
      >
        <input
          type="number"
          name="amount"
          placeholder="Transaction Amount"
          value={formData.amount}
          onChange={handleChange}
          className="fraud-input"
        />

        <input
          type="text"
          name="receiver"
          placeholder="Receiver Name"
          value={formData.receiver}
          onChange={handleChange}
          className="fraud-input"
        />

        <select
          name="transactionType"
          value={formData.transactionType}
          onChange={handleChange}
          className="fraud-input"
        >
          <option value="">
            Select Transaction Type
          </option>

          <option value="bank">
            Bank Transfer
          </option>

          <option value="upi">
            UPI
          </option>

          <option value="crypto">
            Crypto
          </option>
        </select>

        <button
          type="submit"
          className="analyze-btn"
        >
          {loading
            ? "Checking..."
            : "Check Transaction"}
        </button>
      </form>

      {result && (
        <div className="result-card">
          <h2>Fraud Analysis Result</h2>

          <p>
            <strong>Risk Level:</strong>{" "}
            {result.risk}
          </p>

          <p>
            <strong>Fraud Score:</strong>{" "}
            {result.score}
          </p>

          <p>
            <strong>Message:</strong>{" "}
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default FraudDetection;