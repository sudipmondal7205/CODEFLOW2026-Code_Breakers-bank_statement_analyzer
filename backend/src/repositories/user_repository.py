from typing import Dict, Any, Optional
from src.core.database import get_users_collection
from src.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_users_collection())

    def get_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a user by their Google unique identifier.
        """
        return self.find_one({"google_id": google_id})

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a user by their email address.
        """
        return self.find_one({"email": email})
