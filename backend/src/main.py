import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.api.routes import auth as auth_routes
from src.api.routes import statement_routes
from src.services.ai_advisor import generate_ai_insights
from starlette.middleware.sessions import SessionMiddleware
from src.core.database import init_db
import os

load_dotenv()

app = FastAPI(title="Bank Statement NLP Engine", version="1.0")


@app.on_event("startup")
def startup():
    init_db()


app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY")
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(statement_routes.router, prefix="/api/statements", tags=["statements"])

