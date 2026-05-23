from typing import Dict, Any, List
from src.core.database import get_db
from src.repositories.base_repository import BaseRepository

class TransactionRepository(BaseRepository):
    def __init__(self):
        super().__init__(get_db()["transactions"])


    def get_by_statement(self, statement_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all transactions associated with a particular bank statement.
        """
        return self.find_many({"statement_id": statement_id})

    def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all transactions associated with a particular user.
        """
        return self.find_many({"user_id": user_id})


    def insert_many(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Bulk inserts a list of transaction documents and returns the list of serialized documents.
        """
        if not documents:
            return []
        
        result = self.collection.insert_many(documents)
        inserted_ids = result.inserted_ids
        
        cursor = self.collection.find({"_id": {"$in": inserted_ids}})
        return self._serialize_list(list(cursor))
