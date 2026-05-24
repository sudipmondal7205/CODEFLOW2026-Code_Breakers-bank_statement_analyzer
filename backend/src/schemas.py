# backend/src/schemas.py
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's raw password")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"





class UserResponse(BaseModel):
    id: str
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
    transaction_date: Optional[datetime] = Field(
        default=None, description="Post date of the transaction"
    )
    value_date: Optional[datetime] = Field(
        default=None, description="Value date of the transaction"
    )


class TransactionResponse(TransactionCreate):
    id: str
    statement_id: str
    user_id: str
    balance: Optional[str] = '0.0'

    class Config:
        from_attributes = True


class CategoryDistributionItem(BaseModel):
    category: str
    total_amount: float
    percentage: float


class AiInsightItem(BaseModel):
    title: str
    description: str
    severity: Optional[Literal["low", "medium", "high"]] = None
    category: Optional[str] = None


class AiRecommendationItem(BaseModel):
    title: str
    description: str
    category: str
    priority: Literal["low", "medium", "high"] = "medium"
    estimated_monthly_savings_inr: Optional[float] = None


class StructuredAiAnalysis(BaseModel):
    """Structured monthly AI insights for rich UI rendering."""

    headline: str = Field(..., description="One-line executive summary")
    health_assessment: str = Field(
        ..., description="Short paragraph on overall financial health"
    )
    savings_insights: List[AiInsightItem] = Field(default_factory=list)
    spending_alerts: List[AiInsightItem] = Field(default_factory=list)
    recommendations: List[AiRecommendationItem] = Field(default_factory=list)
    action_items: List[str] = Field(
        default_factory=list,
        description="Short, imperative next steps",
    )
    source: Literal["ai", "fallback", "legacy"] = "ai"


class StatementCreate(BaseModel):
    filename: str
    transaction_count: int = 0
    total_income: Optional[float] = None
    total_expenses: Optional[float] = None
    net_savings: Optional[float] = None
    savings_rate: Optional[float] = None
    health_status: Optional[str] = None
    ai_analysis: Optional[StructuredAiAnalysis] = None


class StatementResponse(StatementCreate):
    id: str
    user_id: str
    upload_date: datetime

    class Config:
        from_attributes = True


class StatementUploadResponse(BaseModel):
    statement_id: str
    filename: str
    upload_date: datetime
    transactions_imported: int
    months_present: List[str] = Field(
        default_factory=list,
        description="YYYY-MM months found in imported transactions",
    )


class AiAnalysisResponse(BaseModel):
    month: str
    ai_analysis: StructuredAiAnalysis


class MonthlyAnalyticsResponse(BaseModel):
    month: str = Field(..., description="YYYY-MM")
    period_start: str
    period_end: str
    transaction_count: int
    metrics: dict = Field(..., description="Income, expenses, savings rate, health status")
    category_breakdown: List[CategoryDistributionItem]
    anomalies: List[dict]
    recurring_payments: List[dict]
    ai_analysis: Optional[StructuredAiAnalysis] = Field(
        default=None,
        description="Cached monthly AI insights, if already generated",
    )


AuthResponse.model_rebuild()

