from typing import Any, Dict, Optional

from src.core.database import get_db


def get_monthly_insights_collection():
    return get_db()["monthly_insights"]


def get_monthly_ai_analysis(user_id: str, month: str) -> Optional[Dict[str, Any]]:
    col = get_monthly_insights_collection()
    doc = col.find_one({"user_id": user_id, "month": month})
    if not doc:
        return None
    return {"month": doc["month"], "ai_analysis": doc.get("ai_analysis")}


def save_monthly_ai_analysis(user_id: str, month: str, ai_analysis: Any) -> Dict[str, Any]:
    col = get_monthly_insights_collection()
    col.update_one(
        {"user_id": user_id, "month": month},
        {
            "$set": {
                "user_id": user_id,
                "month": month,
                "ai_analysis": ai_analysis,
            }
        },
        upsert=True,
    )
    return get_monthly_ai_analysis(user_id, month)
