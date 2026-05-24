from typing import List

from fastapi import APIRouter, Depends, Query

from src.core.security import get_current_user
from src.schemas import AiAnalysisResponse, MonthlyAnalyticsResponse
from src.services.analytics_service import (
    generate_and_store_monthly_ai_analysis,
    get_monthly_ai_analysis_for_user,
    get_monthly_analytics,
    get_user_available_months,
    parse_month_param,
)

router = APIRouter()


@router.get("/months", response_model=List[str])
def list_analytics_months(user_id: str = Depends(get_current_user)):
    """Return YYYY-MM values that have at least one dated transaction for this user."""
    return get_user_available_months(user_id)


@router.get("/monthly", response_model=MonthlyAnalyticsResponse)
def get_analytics_for_month(
    month: str = Query(..., description="Calendar month as YYYY-MM, e.g. 2025-01"),
    user_id: str = Depends(get_current_user),
):
    """Analytics for all of the user's transactions in the given calendar month."""
    year, mon = parse_month_param(month)
    return get_monthly_analytics(user_id, year, mon)


@router.get("/monthly/ai-analysis", response_model=AiAnalysisResponse)
def get_monthly_ai_analysis(
    month: str = Query(..., description="Calendar month as YYYY-MM, e.g. 2025-01"),
    user_id: str = Depends(get_current_user),
):
    """Return cached AI insights for a calendar month."""
    year, mon = parse_month_param(month)
    return get_monthly_ai_analysis_for_user(user_id, year, mon)


@router.post("/monthly/ai-analysis", response_model=AiAnalysisResponse)
def create_monthly_ai_analysis(
    month: str = Query(..., description="Calendar month as YYYY-MM, e.g. 2025-01"),
    regenerate: bool = Query(
        False, description="If true, recompute even when cached insights exist"
    ),
    user_id: str = Depends(get_current_user),
):
    """Generate AI insights for all transactions in a calendar month and cache them."""
    year, mon = parse_month_param(month)
    return generate_and_store_monthly_ai_analysis(user_id, year, mon, regenerate=regenerate)
