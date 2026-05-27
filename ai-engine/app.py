from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import os
from dotenv import load_dotenv

from fraud_model import FraudScorer
from nlp_detector import ScamDetector

load_dotenv()

app = FastAPI(
    title="Vyom AI Engine",
    description="Fraud prediction and scam detection AI service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_URL", "http://localhost:5173"),
                   os.getenv("SERVER_URL", "http://localhost:5000")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

fraud_scorer = FraudScorer()
scam_detector = ScamDetector()


class FraudRequest(BaseModel):
    amount: float = Field(..., ge=0, description="Transaction amount")
    location: str = Field(..., min_length=1)
    device: str = Field(..., min_length=1)
    merchant_category: str = Field(default="unknown")


class ScamRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "vyom-ai-engine"}


@app.post("/predict/fraud")
def predict_fraud(req: FraudRequest):
    try:
        result = fraud_scorer.score(
            amount=req.amount,
            location=req.location,
            device=req.device,
            merchant_category=req.merchant_category,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud model error: {str(e)}")


@app.post("/predict/scam")
def predict_scam(req: ScamRequest):
    try:
        result = scam_detector.analyze(content=req.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scam model error: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
