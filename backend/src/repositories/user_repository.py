from src.models.user import User
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

def create_user(user_data: User) -> Dict[str, Any]:
    """Inserts a new user into the database."""
    users_col = get_users_collection()
    
    # Convert Pydantic model to dict, mapping 'id' to '_id' for MongoDB
    user_dict = user_data.model_dump(mode="json")
    user_dict["_id"] = user_dict.pop("id")
    
    res = users_col.insert_one(user_dict)
    user_doc = users_col.find_one({"_id": res.inserted_id})
    return serialize_user(user_doc)
