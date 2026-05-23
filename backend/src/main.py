import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.api.routes import auth as auth_routes
from src.services.ai_advisor import generate_ai_insights
from starlette.middleware.sessions import SessionMiddleware
from src.core.database import init_db
import os

load_dotenv()

app = FastAPI(title="Bank Statement NLP Engine", version="1.0")


@app.on_event("startup")
def startup():
    init_db()


app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])




@app.post("/api/analyze")
def analyze_statement(file: UploadFile = File(...)):
    """
    Inbound multipart ingestion handler.
    """
    if not file.filename.endswith(('.pdf', '.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid extension format. Provide a standard document.")

    mock_scanned_rows = [
        {"raw_narration": "NEFT/SALARY/CORP", "clean_merchant": "INFOSYS TECH", "amount": 85000.0, "transaction_type": "credit"},
        {"raw_narration": "UPI/DR/ZOMATO@paytm", "clean_merchant": "ZOMATO", "amount": 620.0, "transaction_type": "debit"},
        {"raw_narration": "UPI/DR/SWIGGY@oksbi", "clean_merchant": "SWIGGY", "amount": 480.0, "transaction_type": "debit"},
        {"raw_narration": "NETFLIX.COM PREMIUM", "clean_merchant": "NETFLIX", "amount": 649.0, "transaction_type": "debit"},
        {"raw_narration": "NETFLIX.COM PREMIUM", "clean_merchant": "NETFLIX", "amount": 649.0, "transaction_type": "debit"},
        {"raw_narration": "POS/AMAZON INDIA RETAIL", "clean_merchant": "AMAZON", "amount": 22000.0, "transaction_type": "debit"},
        {"raw_narration": "ACH/DR/HDFC-EMI-LOAN", "clean_merchant": "HDFC LOAN", "amount": 15000.0, "transaction_type": "debit"}
    ]

    for row in mock_scanned_rows:
        if row["transaction_type"] == "debit" and classifier_pipeline:
            row["category"] = str(classifier_pipeline.predict([row["raw_narration"]])[0])
        elif row["transaction_type"] == "credit":
            row["category"] = "Salary & Income"
        else:
            row["category"] = "Shopping"

    analytical_metrics = FinancialAnalyticsEngine.calculate_core_metrics(mock_scanned_rows)
    anomaly_metrics = FinancialAnalyticsEngine.detect_anomalies(mock_scanned_rows)

    ai_advisory_insights = generate_ai_insights(analytical_metrics["summary"], anomaly_metrics)

    return {
        "filename": file.filename,
        "metrics": analytical_metrics["summary"],
        "category_breakdown": analytical_metrics["category_distribution"],
        "anomalies": anomaly_metrics["unusual_large_spikes"],
        "recurring_payments": anomaly_metrics["recurring_commitments_detected"],
        "ai_analysis": ai_advisory_insights
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
