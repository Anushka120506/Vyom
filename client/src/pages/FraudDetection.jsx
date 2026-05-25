import { useState } from "react";

function FraudDetection() {
  const [amount, setAmount] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [device, setDevice] =
    useState("");

  const [result, setResult] =
    useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      amount === "" ||
      location === "" ||
      device === ""
    ) {
      setResult("Please fill all fields");
      return;
    }

    if (amount > 5000) {
      setResult(
        "⚠️ High Fraud Risk Detected"
      );
    } else {
      setResult(
        "✅ Transaction Looks Safe"
      );
    }
  };

  return (
    <div className="page">
      <h1>Fraud Detection System</h1>

      <form
        className="fraud-form"
        onSubmit={handleSubmit}
      >
        <input
          type="number"
          placeholder="Transaction Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Transaction Location"
          value={location}
          onChange={(e) =>
            setLocation(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Device Type"
          value={device}
          onChange={(e) =>
            setDevice(e.target.value)
          }
        />

        <button type="submit">
          Analyze Transaction
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h2>{result}</h2>

          <p>
            AI system analyzed transaction
            behavior successfully.
          </p>
        </div>
      )}
    </div>
  );
}

export default FraudDetection;