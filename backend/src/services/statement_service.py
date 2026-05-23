import os
from typing import Dict, Any
from datetime import datetime
from fastapi import HTTPException
from src.parser.parse import get_file
from src.services.pipeline import FinancialAnalyticsEngine
from src.services.ai_advisor import generate_ai_insights
from src.repositories.statement_repository import create_statement
from src.repositories.transaction_repository import create_transactions

def clean_amount(val_str: str) -> float:
    if not val_str:
        return 0.0
    cleaned = val_str.replace(',', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def process_uploaded_statement(file_path: str, filename: str, user_id: str) -> Dict[str, Any]:
    try:
        raw_rows = get_file(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

    if not raw_rows:
        raise HTTPException(status_code=400, detail="No tabular data could be extracted from the file.")

    transactions = []
    
    for row in raw_rows:
        debit_amt = clean_amount(row.get("debit", ""))
        credit_amt = clean_amount(row.get("credit", ""))
        
        amount = 0.0
        tx_type = "unknown"
        category = "General"
        
        if debit_amt > 0:
            amount = debit_amt
            tx_type = "debit"
            category = "Shopping"  # Default mock category for debits
        elif credit_amt > 0:
            amount = credit_amt
            tx_type = "credit"
            category = "Salary & Income"  # Default mock category for credits

        if amount > 0:
            details = row.get("details", "")
            transactions.append({
                "raw_narration": details,
                "clean_merchant": details[:30],  # Mock clean merchant logic
                "amount": amount,
                "transaction_type": tx_type,
                "category": category,
                "user_id": user_id
            })

    if not transactions:
        raise HTTPException(status_code=400, detail="No valid transactions found in the file.")


    metrics = FinancialAnalyticsEngine.calculate_core_metrics(transactions)
    anomalies = FinancialAnalyticsEngine.detect_anomalies(transactions)
    

    insights = generate_ai_insights(metrics["summary"], anomalies)

    statement_data = {
        "user_id": user_id,
        "filename": filename,
        "total_income": metrics["summary"]["total_income"],
        "total_expenses": metrics["summary"]["total_expenses"],
        "net_savings": metrics["summary"]["net_savings"],
        "savings_rate": metrics["summary"]["savings_rate_percentage"],
        "health_status": metrics["summary"]["financial_health_status"],
        "ai_analysis": insights,
        "upload_date": datetime.utcnow()
    }
    saved_statement = create_statement(statement_data)
    statement_id = saved_statement["id"]

    for tx in transactions:
        tx["statement_id"] = statement_id
    
    create_transactions(transactions)

    return {
        "statement_id": statement_id,
        "filename": filename,
        "upload_date": saved_statement["upload_date"].isoformat(),
        "metrics": metrics["summary"],
        "category_breakdown": metrics["category_distribution"],
        "anomalies": anomalies["unusual_large_spikes"],
        "recurring_payments": anomalies["recurring_commitments_detected"],
        "ai_analysis": insights
    }
