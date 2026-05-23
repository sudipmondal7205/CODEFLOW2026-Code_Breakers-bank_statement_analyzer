from fastapi import APIRouter, HTTPException, status
from src.schemas import UserCreate, UserLogin, UserResponse, AuthResponse
from src.services.user_service import register_new_user, authenticate_user
from src.core.security import create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate):
    """Register a new user."""
    return register_new_user(user_in)

@router.post("/login", response_model=AuthResponse)
def login(user_in: UserLogin):
    """Authenticate a user and return a JWT access token."""
    user = authenticate_user(user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user["id"])
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )