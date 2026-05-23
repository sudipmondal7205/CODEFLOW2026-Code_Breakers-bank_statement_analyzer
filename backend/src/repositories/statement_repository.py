from typing import Dict, Any, List
from src.core.database import get_db
from src.repositories.base_repository import BaseRepository

class StatementRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_db()["statements"])

    def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves statements belonging to a user, sorted by upload date descending.
        """
        return self.find_many({"user_id": user_id}, sort_by=[("upload_date", -1)])
