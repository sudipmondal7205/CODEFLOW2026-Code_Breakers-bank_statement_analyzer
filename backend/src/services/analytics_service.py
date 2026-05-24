from calendar import monthrange
from datetime import datetime
from typing import Any, Dict, List, Tuple

from fastapi import HTTPException

from src.repositories.monthly_insights_repository import (
    get_monthly_ai_analysis,
    save_monthly_ai_analysis,
)
from src.repositories.transaction_repository import (
    get_available_months_for_user,
    get_transactions_by_user_for_month,
)
from src.services.ai_advisor import generate_ai_insights, normalize_ai_analysis
from src.services.pipeline import FinancialAnalyticsEngine


def parse_month_param(month: str) -> Tuple[int, int]:
    """Parse YYYY-MM into (year, month)."""
    try:
        year_str, month_str = month.split("-")
        year, mon = int(year_str), int(month_str)
        if not (1 <= mon <= 12):
            raise ValueError
        return year, mon
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid month format. Use YYYY-MM (e.g. 2025-01).",
        )


def get_user_available_months(user_id: str) -> List[str]:
    return get_available_months_for_user(user_id)


def get_monthly_analytics(user_id: str, year: int, month: int) -> Dict[str, Any]:
    transactions = get_transactions_by_user_for_month(user_id, year, month)
    month_key = f"{year:04d}-{month:02d}"

    if not transactions:
        raise HTTPException(
            status_code=404,
            detail=f"No transactions found for {month_key}.",
        )

    metrics = FinancialAnalyticsEngine.calculate_core_metrics(transactions)
    anomalies = FinancialAnalyticsEngine.detect_anomalies(transactions)

    period_start = datetime(year, month, 1)
    last_day = monthrange(year, month)[1]
    period_end = datetime(year, month, last_day, 23, 59, 59)

    cached_ai = get_monthly_ai_analysis(user_id, month_key)

    return {
        "month": month_key,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "transaction_count": len(transactions),
        "metrics": metrics["summary"],
        "category_breakdown": metrics["category_distribution"],
        "anomalies": anomalies["unusual_large_spikes"],
        "recurring_payments": anomalies["recurring_commitments_detected"],
        "ai_analysis": normalize_ai_analysis(cached_ai.get("ai_analysis"))
        if cached_ai
        else None,
    }


def get_monthly_ai_analysis_for_user(
    user_id: str, year: int, month: int
) -> Dict[str, Any]:
    month_key = f"{year:04d}-{month:02d}"
    cached = get_monthly_ai_analysis(user_id, month_key)
    if not cached or not cached.get("ai_analysis"):
        raise HTTPException(
            status_code=404,
            detail=f"No AI analysis found for {month_key}. Generate it first via POST /api/analytics/monthly/ai-analysis.",
        )
    return {
        "month": month_key,
        "ai_analysis": normalize_ai_analysis(cached["ai_analysis"]),
    }


def generate_and_store_monthly_ai_analysis(
    user_id: str, year: int, month: int, *, regenerate: bool = False
) -> Dict[str, Any]:
    month_key = f"{year:04d}-{month:02d}"
    if not regenerate:
        cached = get_monthly_ai_analysis(user_id, month_key)
        if cached and cached.get("ai_analysis"):
            return {
                "month": month_key,
                "ai_analysis": normalize_ai_analysis(cached["ai_analysis"]),
            }

    transactions = get_transactions_by_user_for_month(user_id, year, month)
    if not transactions:
        raise HTTPException(
            status_code=404,
            detail=f"No transactions found for {month_key}.",
        )

    metrics = FinancialAnalyticsEngine.calculate_core_metrics(transactions)
    anomalies_raw = FinancialAnalyticsEngine.detect_anomalies(transactions)
    analytics = {
        "metrics": metrics["summary"],
        "anomalies": anomalies_raw["unusual_large_spikes"],
        "recurring_payments": anomalies_raw["recurring_commitments_detected"],
    }
    anomalies = {
        "unusual_large_spikes": analytics["anomalies"],
        "recurring_commitments_detected": analytics["recurring_payments"],
    }
    ai_analysis = generate_ai_insights(analytics["metrics"], anomalies)
    saved = save_monthly_ai_analysis(user_id, month_key, ai_analysis)
    return {
        "month": month_key,
        "ai_analysis": normalize_ai_analysis(saved["ai_analysis"]),
    }
