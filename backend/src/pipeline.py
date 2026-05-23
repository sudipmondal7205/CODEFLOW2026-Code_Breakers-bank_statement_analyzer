# backend/src/pipeline.py
import numpy as np
from typing import List, Dict, Any



class FinancialAnalyticsEngine:
    @staticmethod
    def calculate_core_metrics(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates absolute totals for credits, debits, net savings, and the financial health score.
        """
        total_income = 0.0
        total_expenses = 0.0
        category_map = {}

        for tx in transactions:
            amount = tx["amount"]
            if tx["transaction_type"] == "credit":
                total_income += amount
            else:
                total_expenses += amount
                cat = tx["category"]
                category_map[cat] = category_map.get(cat, 0.0) + amount

        savings_rate = 0.0
        if total_income > 0:
            savings_rate = ((total_income - total_expenses) / total_income) * 100

        if savings_rate >= 30.0:
            health_badge = "HEALTHY"
        elif 10.0 <= savings_rate < 30.0:
            health_badge = "CAUTION"
        else:
            health_badge = "CRITICAL ALERT"

        highest_expense_cat = max(category_map, key=category_map.get) if category_map else "None"

        category_distribution = [
            {
                "category": cat,
                "total_amount": round(val, 2),
                "percentage": round((val / total_expenses) * 100, 1) if total_expenses > 0 else 0
            }
            for cat, val in category_map.items()
        ]
        category_distribution.sort(key=lambda x: x["total_amount"], reverse=True)

        return {
            "summary": {
                "total_income": round(total_income, 2),
                "total_expenses": round(total_expenses, 2),
                "net_savings": round(max(0.0, total_income - total_expenses), 2),
                "savings_rate_percentage": round(savings_rate, 1),
                "financial_health_status": health_badge,
                "highest_expense_category": highest_expense_cat
            },
            "category_distribution": category_distribution
        }

    @staticmethod
    def detect_anomalies(transactions: List[Dict[str, Any]], outlier_threshold_sigma: float = 2.0) -> Dict[str, Any]:
        """
        Uses statistical standard deviation (Z-score approach) to flag unusually large expense items.
        Also isolates recurring patterns like subscriptions or fixed monthly EMIs.
        """
        debits = [tx["amount"] for tx in transactions if tx["transaction_type"] == "debit"]
        
        large_spikes = []
        if len(debits) >= 3:
            mean_expense = np.mean(debits)
            std_expense = np.std(debits)
            
            for tx in transactions:
                if tx["transaction_type"] == "debit" and tx["amount"] > (mean_expense + (outlier_threshold_sigma * std_expense)):
                    large_spikes.append({
                        "narration": tx["raw_narration"],
                        "amount": tx["amount"],
                        "category": tx["category"]
                    })

        merchant_signature_counts = {}
        for tx in transactions:
            if tx["transaction_type"] == "debit":

                sig = (tx["clean_merchant"], tx["amount"])
                merchant_signature_counts[sig] = merchant_signature_counts.get(sig, 0) + 1

        recurring_commitments = [
            {
                "merchant": sig[0],
                "amount": sig[1],
                "frequency_estimate": "Monthly / Subscription"
            }
            for sig, count in merchant_signature_counts.items() if count >= 2
        ]

        return {
            "unusual_large_spikes": large_spikes[:5],
            "recurring_commitments_detected": recurring_commitments
        }