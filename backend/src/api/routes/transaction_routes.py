from typing import List

from fastapi import APIRouter, Depends

from src.core.security import get_current_user
from src.repositories.transaction_repository import get_transactions_by_user
from src.schemas import TransactionResponse

router = APIRouter()


@router.get("/", response_model=List[TransactionResponse])
def get_my_transactions(user_id: str = Depends(get_current_user)):
    """Return all transactions for the currently logged-in user."""
    return get_transactions_by_user(user_id)
