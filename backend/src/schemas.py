# backend/src/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., description="ID token from Google Sign-In (GIS / One Tap)")


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserSyncRequest(BaseModel):
    google_id: str
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: Optional[bool] = None
    locale: Optional[str] = None


class UserSyncResponse(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: str
    google_id: str
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: Optional[bool] = None
    locale: Optional[str] = None
    monthly_savings_goal: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    monthly_savings_goal: float = Field(default=0.0, description="Monthly targeted savings amount in INR")


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    monthly_savings_goal: Optional[float] = Field(
        default=None, description="Monthly targeted savings amount in INR"
    )


class UserProfileResponse(UserProfileBase):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True



class TransactionCreate(BaseModel):
    raw_narration: str
    clean_merchant: Optional[str] = None
    amount: float
    transaction_type: str = Field(..., description="'credit' or 'debit'")
    category: str = Field(..., description="Assigned vertical via scikit-learn pipeline")


class TransactionResponse(TransactionCreate):
    id: str
    statement_id: str
    user_id: str

    class Config:
        from_attributes = True


class StatementCreate(BaseModel):
    filename: str
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float = Field(..., description="Calculated savings ratio percentage")
    health_status: str = Field(..., description="HEALTHY, CAUTION, or CRITICAL ALERT")
    ai_analysis: Optional[str] = None


class StatementResponse(StatementCreate):
    id: str
    user_id: str
    upload_date: datetime

    class Config:
        from_attributes = True



class CategoryDistributionItem(BaseModel):
    category: str
    total_amount: float
    percentage: float


class FullAnalysisPayloadResponse(BaseModel):
    """
    The ultimate contract model returned to your frontend team to render 
    dashboards, Recharts components, and historical data logs.
    """
    statement_id: str
    filename: str
    upload_date: str
    metrics: dict = Field(..., description="Contains standard income, expense, and rate objects")
    category_breakdown: List[CategoryDistributionItem]
    anomalies: List[dict]
    recurring_payments: List[dict]
    ai_analysis: Optional[str] = None


AuthResponse.model_rebuild()

