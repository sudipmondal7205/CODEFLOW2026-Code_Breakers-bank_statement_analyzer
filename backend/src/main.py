from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.api.routes import auth as auth_routes
from src.api.routes import statement_routes
from src.api.routes import transaction_routes
from src.api.routes import analytics_routes
from starlette.middleware.sessions import SessionMiddleware
from src.core.database import init_db
from src.services.categorizer import load_categorizer
import os
from src.api.profile import router_profile
from dotenv import load_dotenv




load_dotenv()

FRONTEND_URL=os.getenv('FRONTEND_URL')

app = FastAPI(title="Bank Statement NLP Engine", version="1.0")



@app.on_event("startup")
def startup():
    init_db()
    load_categorizer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(statement_routes.router, prefix="/api/statements", tags=["statements"])
app.include_router(transaction_routes.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analytics_routes.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(router_profile, prefix="/api/profile", tags=["profile"])
