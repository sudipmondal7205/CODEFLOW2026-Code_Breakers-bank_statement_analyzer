import os

import cohere

API_KEY = os.getenv("COHERE_API_KEY")

cohere_client = cohere.Client(api_key=API_KEY) if API_KEY else None


def generate_ai_insights(summary: dict, anomalies: dict) -> str:
    """
    Constructs a detailed prompt context and requests the Cohere API to compile a
    scannable, expert financial advisory summary.
    """
    if not cohere_client:
        return "AI Advisor Unavailable: Missing configuration COHERE_API_KEY credential."

    prompt = f"""
    You are an expert financial consultant analyzing an individual's monthly bank statement data.
    Review these calculated metrics and provide concise, actionable observations.

    FINANCIAL METRICS OVERVIEW:
    - Total Income Received: INR {summary['total_income']}
    - Total Expenses Deducted: INR {summary['total_expenses']}
    - Net Total Saved: INR {summary['net_savings']}
    - Savings Ratio: {summary['savings_rate_percentage']}%
    - Assigned Health Badge: {summary['financial_health_status']}
    - Dominant Expense Category: {summary['highest_expense_category']}

    DETECTED ANOMALIES & LOOPS:
    - High-Value Spending Outliers: {anomalies['unusual_large_spikes']}
    - Ongoing Subscriptions/EMIs: {anomalies['recurring_commitments_detected']}

    YOUR INSTRUCTIONS:
    Provide exactly three high-impact, short bullet points:
    1. One structural observation regarding their saving ratios and general category distribution habits.
    2. One warning regarding their largest spending anomalies or subscription leaks.
    3. One proactive next step to maximize their financial health index over the upcoming month.
    Keep the tone professional, straightforward, and direct. Do not use generic filler text.
    """

    try:
        response = cohere_client.chat(
            model="command-r-plus-08-2024",
            message=prompt,
            temperature=0.3
        )
        return response.text.strip()
    except Exception as e:
        return f"Failed to gather AI suggestions due to network response: {str(e)}"
