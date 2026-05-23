from datetime import datetime
from typing import Dict, Any, List, Optional
from src.repositories.statement_repository import StatementRepository
from src.repositories.transaction_repository import TransactionRepository
from src.services.pipeline import FinancialAnalyticsEngine
from src.services.ai_advisor import generate_ai_insights

class StatementService:
    def __init__(self):
        self.statement_repo = StatementRepository()
        self.transaction_repo = TransactionRepository()

    def analyze_and_persist_statement(
        self, 
        filename: str, 
        parsed_rows: List[Dict[str, Any]], 
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates the entire bank statement analysis:
        1. Categorizes transactions (checks transaction type, applying fallback logic).
        2. Calculates core analytics (credits, debits, health score).
        3. Isolates outliers (Z-score anomaly check) and subscription commits.
        4. Generates AI consultant insights using the Cohere service.
        5. If user_id is provided, persists statement metadata and transactions in MongoDB.
        """
        # Ensure categories exist
        for row in parsed_rows:
            if "category" not in row or not row["category"]:
                if row["transaction_type"] == "credit":
                    row["category"] = "Salary & Income"
                else:
                    row["category"] = "Shopping"

        # Calculate core metrics & detect anomalies
        analytical_metrics = FinancialAnalyticsEngine.calculate_core_metrics(parsed_rows)
        anomaly_metrics = FinancialAnalyticsEngine.detect_anomalies(parsed_rows)

        # Generate AI consulting insights
        ai_advisory_insights = generate_ai_insights(
            analytical_metrics["summary"], 
            anomaly_metrics
        )

        statement_id = "anonymous_statement"
        upload_date_str = datetime.utcnow().isoformat()

        if user_id:
            # 1. Save statement metadata
            statement_data = {
                "user_id": user_id,
                "filename": filename,
                "total_income": analytical_metrics["summary"]["total_income"],
                "total_expenses": analytical_metrics["summary"]["total_expenses"],
                "net_savings": analytical_metrics["summary"]["net_savings"],
                "savings_rate": analytical_metrics["summary"]["savings_rate_percentage"],
                "health_status": analytical_metrics["summary"]["financial_health_status"],
                "ai_analysis": ai_advisory_insights,
                "upload_date": datetime.utcnow()
            }
            statement_doc = self.statement_repo.insert_one(statement_data)
            statement_id = statement_doc["id"]
            
            if isinstance(statement_doc["upload_date"], datetime):
                upload_date_str = statement_doc["upload_date"].isoformat()
            else:
                upload_date_str = str(statement_doc["upload_date"])

            # 2. Bulk insert transactions
            tx_documents = []
            for row in parsed_rows:
                tx_documents.append({
                    "statement_id": statement_id,
                    "user_id": user_id,
                    "raw_narration": row["raw_narration"],
                    "clean_merchant": row.get("clean_merchant"),
                    "amount": row["amount"],
                    "transaction_type": row["transaction_type"],
                    "category": row["category"]
                })
            
            self.transaction_repo.insert_many(tx_documents)
            print(f"Persisted statement {statement_id} and {len(tx_documents)} transactions for user: {user_id}")

        return {
            "statement_id": statement_id,
            "filename": filename,
            "upload_date": upload_date_str,
            "metrics": analytical_metrics["summary"],
            "category_breakdown": analytical_metrics["category_distribution"],
            "anomalies": anomaly_metrics["unusual_large_spikes"],
            "recurring_payments": anomaly_metrics["recurring_commitments_detected"],
            "ai_analysis": ai_advisory_insights
        }
