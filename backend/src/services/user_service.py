from src.models.user import User
from datetime import datetime
from typing import Dict, Any
from fastapi import HTTPException, status
from src.schemas import UserCreate, UserLogin
from src.repositories.user_repository import get_user_by_email, create_user
from src.core.security import get_password_hash, verify_password
from src.api.routes.budget import create_budget_data

Budgets_list=['Food','Shopping','Rent','Travel','Subscriptions','EMIs / Loan Payments','Miscellaneous / Others']


def register_new_user(user_in: UserCreate) -> Dict[str, Any]:

    user = get_user_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    hashed_password = get_password_hash(user_in.password)
    
    # Construct the user document to be saved
    full_name = user_in.full_name
    if not full_name and (user_in.first_name or user_in.last_name):
        full_name = f"{user_in.first_name or ''} {user_in.last_name or ''}".strip()

    user_data = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=full_name or None,
        first_name=user_in.first_name,
        last_name=user_in.last_name
    )
    
    # Save the new user into the repository
    created_user = create_user(user_data)
    # print("\n\n", created_user)
    for i in Budgets_list:
        _=create_budget_data(created_user["id"],i,0,0)
    return created_user

def authenticate_user(user_in: UserLogin) -> Dict[str, Any]:
   
    user = get_user_by_email(user_in.email)
    if not user:
        return None
    
    if not verify_password(user_in.password, user.get("hashed_password", "")):
        return None
    
    return user