from typing import Dict, Any, Optional
from bson import ObjectId
from src.core.database import get_users_collection

def serialize_user(user_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Converts MongoDB document ObjectId (_id) to string (id)."""
    if not user_doc:
        return None
    user_doc = dict(user_doc)
    user_doc["id"] = str(user_doc.pop("_id"))
    return user_doc

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetches a user from the database by email."""
    users_col = get_users_collection()
    user_doc = users_col.find_one({"email": email})
    return serialize_user(user_doc)

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Inserts a new user into the database."""
    users_col = get_users_collection()
    res = users_col.insert_one(user_data)
    user_doc = users_col.find_one({"_id": res.inserted_id})
    return serialize_user(user_doc)
