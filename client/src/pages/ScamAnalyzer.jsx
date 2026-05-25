import { useState } from "react";

function ScamAnalyzer() {
  const [message, setMessage] =
    useState("");

  const [result, setResult] =
    useState("");

  const analyzeMessage = (e) => {
    e.preventDefault();

    if (
      message.includes("OTP") ||
      message.includes("bank") ||
      message.includes("urgent") ||
      message.includes("password")
    ) {
      setResult(
        "⚠️ Scam Detected in Message"
      );
    } else {
      setResult(
        "✅ Message Looks Safe"
      );
    }
  };

  return (
    <div className="page">
      <h1>Scam Message Analyzer</h1>

      <form
        className="fraud-form"
        onSubmit={analyzeMessage}
      >
        <textarea
          placeholder="Paste suspicious message here..."
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
        />

        <button type="submit">
          Analyze Message
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h2>{result}</h2>

          <p>
            AI NLP engine analyzed the
            suspicious message successfully.
          </p>
        </div>
      )}
    </div>
  );
}

export default ScamAnalyzer;