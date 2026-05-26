"""
Vyom AI Engine — Flask API server.

Provides ML-backed risk scoring endpoints that the Node.js backend
can call optionally. The Node backend has its own rule engine as
primary fallback, so this service failing gracefully is acceptable.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from fraud_model import score_transaction
from nlp_detector import analyze_message

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("vyom-ai")

# ── App ──────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGIN", "http://localhost:5000"))


@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} from {request.remote_addr}")


@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": str(e)}), 400


@app.errorhandler(500)
def server_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify({"error": "Internal AI engine error"}), 500


# ── Health ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "vyom-ai-engine"})


# ── Transaction scoring ──────────────────────────────────────────────────────
@app.route("/api/score/transaction", methods=["POST"])
def score_txn():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ["amount", "location", "deviceType"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        result = score_transaction(
            amount=float(data["amount"]),
            location=str(data["location"]),
            device_type=str(data["deviceType"]),
            merchant_category=str(data.get("merchantCategory", "")),
        )
        logger.info(f"Transaction scored: {result['score']}/100 ({result['level']})")
        return jsonify(result)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400
    except Exception as e:
        logger.error(f"Scoring error: {e}")
        return jsonify({"error": "Scoring failed"}), 500


# ── Message analysis ─────────────────────────────────────────────────────────
@app.route("/api/score/message", methods=["POST"])
def score_message():
    data = request.get_json(silent=True)
    if not data or "message" not in data:
        return jsonify({"error": "Field 'message' is required"}), 400

    message = str(data["message"]).strip()
    if len(message) < 3:
        return jsonify({"error": "Message too short"}), 400
    if len(message) > 10000:
        return jsonify({"error": "Message too long (max 10000 chars)"}), 400

    try:
        result = analyze_message(message)
        logger.info(f"Message analyzed: {result['score']}/100 ({result['level']})")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Message analysis error: {e}")
        return jsonify({"error": "Analysis failed"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    logger.info(f"Vyom AI Engine starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
