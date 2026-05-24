from datetime import datetime
from typing import Dict, Any, List, Optional

from src.core.database import get_db

def get_transactions_collection():
    db = get_db()
    return db["transactions"]

def serialize_doc(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc

def create_transactions(transactions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not transactions_data:
        return []
    col = get_transactions_collection()
    res = col.insert_many(transactions_data)
    
    inserted_ids = res.inserted_ids
    docs = col.find({"_id": {"$in": inserted_ids}})
    return [serialize_doc(doc) for doc in docs]

def get_transactions_by_statement(statement_id: str) -> List[Dict[str, Any]]:
    col = get_transactions_collection()
    cursor = col.find({"statement_id": statement_id})
    return [serialize_doc(doc) for doc in cursor]

def get_transactions_by_user(user_id: str) -> List[Dict[str, Any]]:
    col = get_transactions_collection()
    cursor = col.find({"user_id": user_id}).sort("_id", -1)
    return [serialize_doc(doc) for doc in cursor]


def _month_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def get_transactions_by_user_for_month(
    user_id: str, year: int, month: int
) -> List[Dict[str, Any]]:
    start, end = _month_bounds(year, month)
    col = get_transactions_collection()
    cursor = col.find(
        {
            "user_id": user_id,
            "transaction_date": {"$gte": start, "$lt": end},
        }
    ).sort("transaction_date", 1)
    return [serialize_doc(doc) for doc in cursor]


def get_available_months_for_user(user_id: str) -> List[str]:
    col = get_transactions_collection()
    pipeline = [
        {"$match": {"user_id": user_id, "transaction_date": {"$exists": True, "$ne": None}}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$transaction_date"},
                    "month": {"$month": "$transaction_date"},
                }
            }
        },
        {"$sort": {"_id.year": -1, "_id.month": -1}},
    ]
    months: List[str] = []
    for doc in col.aggregate(pipeline):
        y = doc["_id"]["year"]
        m = doc["_id"]["month"]
        months.append(f"{y:04d}-{m:02d}")
    return months
