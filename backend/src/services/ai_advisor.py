import json
import os
import re
from typing import Any, Dict, List, Optional

import cohere
from pydantic import ValidationError

from src.schemas import StructuredAiAnalysis

API_KEY = os.getenv("COHERE_API_KEY")

cohere_client = cohere.Client(api_key=API_KEY) if API_KEY else None

_JSON_SCHEMA_HINT = """
{
  "headline": "string — one-line executive summary",
  "health_assessment": "string — 2-3 sentences on overall financial health",
  "savings_insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "low|medium|high|null",
      "category": "string|null"
    }
  ],
  "spending_alerts": [
    {
      "title": "string",
      "description": "string",
      "severity": "low|medium|high",
      "category": "string|null"
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "category": "string — e.g. Savings, Food, Subscriptions",
      "priority": "low|medium|high",
      "estimated_monthly_savings_inr": number|null
    }
  ],
  "action_items": ["string — short imperative steps"]
}
"""


def _fallback_analysis(
    headline: str,
    health_assessment: str,
    *,
    source: str = "fallback",
) -> Dict[str, Any]:
    return StructuredAiAnalysis(
        headline=headline,
        health_assessment=health_assessment,
        savings_insights=[],
        spending_alerts=[],
        recommendations=[],
        action_items=[],
        source=source,
    ).model_dump()


def normalize_ai_analysis(raw: Any) -> Optional[Dict[str, Any]]:
    """Coerce cached DB values (legacy plain text or dict) into StructuredAiAnalysis."""
    if raw is None:
        return None
    if isinstance(raw, dict):
        try:
            return StructuredAiAnalysis.model_validate(raw).model_dump()
        except ValidationError:
            pass
    if isinstance(raw, str) and raw.strip():
        return StructuredAiAnalysis(
            headline="Previous analysis (legacy format)",
            health_assessment=raw.strip(),
            source="legacy",
        ).model_dump()
    return None


def _extract_json_object(text: str) -> Optional[dict]:
    text = text.strip()
    if not text:
        return None

    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return None
    return None


def _coerce_insight_items(items: Any) -> List[dict]:
    if not isinstance(items, list):
        return []
    out = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        description = str(item.get("description") or "").strip()
        if not title or not description:
            continue
        severity = item.get("severity")
        if severity not in ("low", "medium", "high"):
            severity = None
        category = item.get("category")
        out.append(
            {
                "title": title,
                "description": description,
                "severity": severity,
                "category": str(category).strip() if category else None,
            }
        )
    return out


def _coerce_recommendations(items: Any) -> List[dict]:
    if not isinstance(items, list):
        return []
    out = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        description = str(item.get("description") or "").strip()
        category = str(item.get("category") or "General").strip()
        if not title or not description:
            continue
        priority = item.get("priority")
        if priority not in ("low", "medium", "high"):
            priority = "medium"
        savings = item.get("estimated_monthly_savings_inr")
        if savings is not None:
            try:
                savings = float(savings)
            except (TypeError, ValueError):
                savings = None
        out.append(
            {
                "title": title,
                "description": description,
                "category": category,
                "priority": priority,
                "estimated_monthly_savings_inr": savings,
            }
        )
    return out


def _coerce_action_items(items: Any) -> List[str]:
    if not isinstance(items, list):
        return []
    return [str(x).strip() for x in items if str(x).strip()]


def _build_structured_payload(parsed: dict) -> Dict[str, Any]:
    headline = str(parsed.get("headline") or "").strip()
    health_assessment = str(parsed.get("health_assessment") or "").strip()
    if not headline:
        headline = "Monthly financial review"
    if not health_assessment:
        health_assessment = "Review your spending patterns and savings rate for this period."

    payload = {
        "headline": headline,
        "health_assessment": health_assessment,
        "savings_insights": _coerce_insight_items(parsed.get("savings_insights")),
        "spending_alerts": _coerce_insight_items(parsed.get("spending_alerts")),
        "recommendations": _coerce_recommendations(parsed.get("recommendations")),
        "action_items": _coerce_action_items(parsed.get("action_items")),
        "source": "ai",
    }
    return StructuredAiAnalysis.model_validate(payload).model_dump()


def generate_ai_insights(summary: dict, anomalies: dict) -> Dict[str, Any]:
    """
    Request structured JSON insights from Cohere for monthly analytics APIs.
    Returns a dict matching StructuredAiAnalysis.
    """
    if not cohere_client:
        return _fallback_analysis(
            "AI advisor unavailable",
            "Configure the COHERE_API_KEY environment variable to enable AI-generated insights.",
        )

    prompt = f"""
You are an expert financial consultant analyzing an individual's monthly bank statement.

FINANCIAL METRICS:
- Total Income: INR {summary['total_income']}
- Total Expenses: INR {summary['total_expenses']}
- Net Savings: INR {summary['net_savings']}
- Savings Rate: {summary['savings_rate_percentage']}%
- Health Badge: {summary['financial_health_status']}
- Top Expense Category: {summary['highest_expense_category']}

ANOMALIES & RECURRING CHARGES:
- Large spending outliers: {anomalies['unusual_large_spikes']}
- Recurring commitments: {anomalies['recurring_commitments_detected']}

Respond with ONLY valid JSON (no markdown, no preamble) matching this schema:
{_JSON_SCHEMA_HINT}

Content rules:
- Provide 2-4 items in savings_insights (savings rate, category habits, income stability).
- Provide 1-4 items in spending_alerts (outliers, subscriptions, category overspend).
- Provide 3-5 items in recommendations (specific, actionable, tied to the data).
- Provide 3-5 action_items (short imperative phrases).
- Use INR amounts where relevant. Be direct; avoid generic filler.
- severity and priority must be exactly "low", "medium", or "high" when set.
"""

    try:
        response = cohere_client.chat(
            model="command-r-plus-08-2024",
            message=prompt,
            temperature=0.3,
        )
        parsed = _extract_json_object(response.text)
        if not parsed:
            return _fallback_analysis(
                "Could not parse AI response",
                "The advisor returned an unexpected format. Try regenerating insights.",
            )
        return _build_structured_payload(parsed)
    except Exception as e:
        return _fallback_analysis(
            "AI insights generation failed",
            f"Unable to complete the analysis: {str(e)}",
        )
