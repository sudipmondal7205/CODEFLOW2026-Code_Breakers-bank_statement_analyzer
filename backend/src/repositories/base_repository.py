from typing import Dict, Any, List, Optional
from pymongo.collection import Collection

class BaseRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def _serialize(self, document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Converts the MongoDB ObjectId (_id) to a string (id).
        """
        if not document:
            return None
        doc = dict(document)
        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    def _serialize_list(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts a list of MongoDB documents by serializing each.
        """
        return [self._serialize(doc) for doc in documents if doc]

    def find_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Finds a single document matching the filter query.
        """
        doc = self.collection.find_one(filter_query)
        return self._serialize(doc)

    def find_many(self, filter_query: Dict[str, Any], sort_by: Optional[List[tuple]] = None) -> List[Dict[str, Any]]:
        """
        Finds multiple documents matching the filter query, with optional sorting.
        """
        cursor = self.collection.find(filter_query)
        if sort_by:
            cursor = cursor.sort(sort_by)
        return self._serialize_list(list(cursor))

    def insert_one(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inserts a single document and returns the serialized inserted document.
        """
        result = self.collection.insert_one(data)
        doc = self.collection.find_one({"_id": result.inserted_id})
        return self._serialize(doc)

    def update_one(self, filter_query: Dict[str, Any], update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates a single document matching the filter query and returns the updated document.
        """
        self.collection.update_one(filter_query, {"$set": update_data})
        doc = self.collection.find_one(filter_query)
        return self._serialize(doc)

    def delete_many(self, filter_query: Dict[str, Any]) -> int:
        """
        Deletes multiple documents matching the filter query and returns the deleted count.
        """
        result = self.collection.delete_many(filter_query)
        return result.deleted_count
