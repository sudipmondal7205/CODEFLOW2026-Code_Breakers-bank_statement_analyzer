from typing import Dict, Any, List, Optional
from src.core.database import get_db

def get_statements_collection():
    db = get_db()
    return db["statements"]

def serialize_doc(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def create_statement(statement_data: Dict[str, Any]) -> Dict[str, Any]:
    col = get_statements_collection()
    res = col.insert_one(statement_data)
    doc = col.find_one({"_id": res.inserted_id})
    return serialize_doc(doc)


def get_statements_by_user(user_id: str) -> List[Dict[str, Any]]:
    col = get_statements_collection()
    cursor = col.find({"user_id": user_id}).sort("upload_date", -1)
    return [serialize_doc(doc) for doc in cursor]
