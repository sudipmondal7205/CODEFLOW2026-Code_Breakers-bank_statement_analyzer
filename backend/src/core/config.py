from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
ML_MODEL_PATH = BACKEND_ROOT / "ml_models" / "transaction_categorizer.pkl"
