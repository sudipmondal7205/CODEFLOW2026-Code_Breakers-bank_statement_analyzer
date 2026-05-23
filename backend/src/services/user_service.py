from datetime import datetime
from typing import Dict, Any, Optional
from bson.objectid import ObjectId
from src.repositories.user_repository import UserRepository

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    def get_user_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a user by their Google unique identifier.
        """
        return self.user_repo.get_by_google_id(google_id)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a user by their email address.
        """
        return self.user_repo.get_by_email(email)

    def sync_user(self, user_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synchronizes the authenticated Google user details with the MongoDB collection.
        - If user exists (by google_id or email), update their profile details (avatar, name, etc.).
        - If user is new, insert them with a default monthly savings goal and creation timestamp.
        """
        google_id = user_info.get("sub")
        email = user_info.get("email")
        
        if not google_id or not email:
            raise ValueError("Google login user_info must contain both 'sub' (google_id) and 'email'")

        # Query by google_id or email
        user_doc = self.user_repo.find_one({"$or": [{"google_id": google_id}, {"email": email}]})
        
        now = datetime.utcnow()
        
        update_fields = {
            "google_id": google_id,
            "email": email,
            "full_name": user_info.get("name"),
            "first_name": user_info.get("given_name"),
            "last_name": user_info.get("family_name"),
            "picture": user_info.get("picture"),
            "email_verified": user_info.get("email_verified"),
            "locale": user_info.get("locale"),
            "updated_at": now
        }
        
        if user_doc:
            # User exists: Update profile details
            updated_doc = self.user_repo.update_one({"_id": ObjectId(user_doc["id"])}, update_fields)
            print(f"Synced existing user via UserRepository: {email}")
        else:
            # New user: Create user document
            insert_data = {
                **update_fields,
                "monthly_savings_goal": 0.0,
                "created_at": now
            }
            updated_doc = self.user_repo.insert_one(insert_data)
            print(f"Created new user via UserRepository sync: {email}")
            
        return updated_doc

# ==========================================
# Backwards compatibility wrappers
# ==========================================
_user_service = None

def get_user_service() -> UserService:
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service

def sync_user(user_info: Dict[str, Any]) -> Dict[str, Any]:
    return get_user_service().sync_user(user_info)

def get_user_by_google_id(google_id: str) -> Optional[Dict[str, Any]]:
    return get_user_service().get_user_by_google_id(google_id)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return get_user_service().get_user_by_email(email)
