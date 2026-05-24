from typing import Dict, Any, List, Optional

from bson import ObjectId
from bson.errors import InvalidId

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


def get_statement_by_id(statement_id: str) -> Optional[Dict[str, Any]]:
    col = get_statements_collection()
    try:
        doc = col.find_one({"_id": ObjectId(statement_id)})
    except InvalidId:
        return None
    return serialize_doc(doc)


def update_statement_ai_analysis(statement_id: str, ai_analysis: str) -> Optional[Dict[str, Any]]:
    col = get_statements_collection()
    try:
        oid = ObjectId(statement_id)
    except InvalidId:
        return None

    col.update_one({"_id": oid}, {"$set": {"ai_analysis": ai_analysis}})
    doc = col.find_one({"_id": oid})
    return serialize_doc(doc)
