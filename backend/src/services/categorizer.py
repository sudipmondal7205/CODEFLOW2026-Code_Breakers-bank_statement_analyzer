import logging
from typing import Optional

import joblib

from src.core.config import ML_MODEL_PATH

logger = logging.getLogger(__name__)

SALARY_CATEGORY = "Salary & Income"
DEFAULT_DEBIT_CATEGORY = "Shopping"

_model: Optional[object] = None


def load_categorizer() -> None:
    """Load the sklearn pipeline from disk. Call once at app startup."""
    global _model
    if not ML_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Transaction categorizer not found at {ML_MODEL_PATH}. "
            "Run: python -m src.services.trainer"
        )
    _model = joblib.load(ML_MODEL_PATH)
    logger.info("Transaction categorizer loaded from %s", ML_MODEL_PATH)


def predict_category(narration: str, transaction_type: str) -> str:
    """Classify a transaction narration into a spending category."""
    if _model is None:
        raise RuntimeError("Categorizer not loaded. Call load_categorizer() at startup.")

    text = (narration or "").strip()
    if not text:
        return SALARY_CATEGORY if transaction_type == "credit" else DEFAULT_DEBIT_CATEGORY

    predicted = _model.predict([text])[0]

    if transaction_type == "debit" and predicted == SALARY_CATEGORY:
        proba = _model.predict_proba([text])[0]
        classes = list(_model.classes_)
        ranked = sorted(zip(classes, proba), key=lambda x: x[1], reverse=True)
        for category, _ in ranked:
            if category != SALARY_CATEGORY:
                return category
        return DEFAULT_DEBIT_CATEGORY

    return predicted
