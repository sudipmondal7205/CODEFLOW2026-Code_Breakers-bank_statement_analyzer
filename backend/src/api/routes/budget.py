from src.core.database import get_budgets_collection

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from src.core.user_detail import get_current_user
from typing import Optional

router_budget = APIRouter(prefix="/api/budget", tags=["Budget"])


class BudgetCreate(BaseModel):
    category: str
    budget_amount: float
    spent_amount: float = 0
    # remaining_amount: float



def create_budget_data(
    user_id: str,
    category: str,
    budget_amount: float,
    spent_amount: float = 0
):

    budgets_collection = get_budgets_collection()

    remaining_amount = max(
        budget_amount - spent_amount,
        0
    )

    budget_data = {
        "user_id": user_id,
        "category": category,
        "budget_amount": budget_amount,
        "spent_amount": spent_amount,
        "remaining_amount": remaining_amount,
        "month": datetime.now().strftime("%Y-%m"),
        "created_at": datetime.utcnow()
    }

    result = budgets_collection.insert_one(
        budget_data
    )

    return str(result.inserted_id)


@router_budget.get("/")
def get_user_budgets(current_user=Depends(get_current_user)):

    budgets_collection = get_budgets_collection()

    budgets = list(budgets_collection.find({"user_id": current_user["id"]}))

    formatted_budgets = []

    for budget in budgets:

        budget["_id"] = str(budget["_id"])

        formatted_budgets.append(budget)

    return {
        "success": True,
        "count": len(formatted_budgets),
        "budgets": formatted_budgets,
    }



class BudgetUpdate(BaseModel):
    budget_amount: Optional[float] = None
    spent_amount: Optional[float] = None


@router_budget.put("/{category}")
def update_budget(
    category: str,
    budget: BudgetUpdate,
    current_user=Depends(get_current_user)
):

    budgets_collection = get_budgets_collection()

    existing_budget = budgets_collection.find_one(
        {
            "user_id": current_user["id"],
            "category": category
        }
    )

    if not existing_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget category not found"
        )

    # Keep old values if not supplied
    budget_amount = (
        budget.budget_amount
        if budget.budget_amount is not None
        else existing_budget["budget_amount"]
    )

    spent_amount = (
        budget.spent_amount
        if budget.spent_amount is not None
        else existing_budget["spent_amount"]
    )

    remaining_amount = max(
        budget_amount - spent_amount,
        0
    )

    update_data = {
        "budget_amount": budget_amount,
        "spent_amount": spent_amount,
        "remaining_amount": remaining_amount
    }

    budgets_collection.update_one(
        {
            "user_id": current_user["id"],
            "category": category
        },
        {
            "$set": update_data
        }
    )

    return {
        "success": True,
        "message": "Budget updated successfully",
        "updated_data": update_data
    }
