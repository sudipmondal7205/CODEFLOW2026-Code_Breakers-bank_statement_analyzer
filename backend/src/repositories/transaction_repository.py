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
