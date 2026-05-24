import os
from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException
from src.parser.parse import get_file
from src.parser.date_utils import extract_row_dates
from src.services.categorizer import predict_category
from src.repositories.statement_repository import create_statement
from src.repositories.transaction_repository import create_transactions

def _months_from_transactions(transactions: List[Dict[str, Any]]) -> List[str]:
    months = set()
    for tx in transactions:
        dt = tx.get("transaction_date") or tx.get("value_date")
        if dt:
            months.add(dt.strftime("%Y-%m"))
    return sorted(months)


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

        if debit_amt > 0:
            amount = debit_amt
            tx_type = "debit"
        elif credit_amt > 0:
            amount = credit_amt
            tx_type = "credit"

        if amount > 0:
            details = row.get("details", "")
            category = predict_category(details, tx_type)
            post_date, value_date = extract_row_dates(row)
            tx_record = {
                "raw_narration": details,
                "clean_merchant": details[:30],
                "amount": amount,
                "transaction_type": tx_type,
                "category": category,
                "user_id": user_id,
                "transaction_date": post_date,
                "value_date": value_date,
                "balance": row.get("balance", ""),
            }
            transactions.append(tx_record)

    if not transactions:
        raise HTTPException(status_code=400, detail="No valid transactions found in the file.")

    months_present = _months_from_transactions(transactions)

    statement_data = {
        "user_id": user_id,
        "filename": filename,
        "transaction_count": len(transactions),
        "upload_date": datetime.utcnow(),
    }
    saved_statement = create_statement(statement_data)
    statement_id = saved_statement["id"]

    for tx in transactions:
        tx["statement_id"] = statement_id

    create_transactions(transactions)

    return {
        "statement_id": statement_id,
        "filename": filename,
        "upload_date": saved_statement["upload_date"],
        "transactions_imported": len(transactions),
        "months_present": months_present,
    }
