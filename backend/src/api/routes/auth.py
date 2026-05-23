# Session middleware required
from fastapi import Request
from starlette.responses import JSONResponse
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
import os
from fastapi import APIRouter
from dotenv import load_dotenv
from src.services.user_service import sync_user
from src.schemas import UserResponse

load_dotenv()


oauth = OAuth()

router = APIRouter()


oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),

    server_metadata_url=(
        "https://accounts.google.com/.well-known/openid-configuration"
    ),

    client_kwargs={
        "scope": "openid email profile"
    }
)


@router.get("/")
def home():
    return {
        "message":"Home page",
        "login":"Go to /login"
    }


@router.get("/login")
async def login(request: Request):
    print("Initiating login, session currently is:", request.session)
    redirect_uri = request.url_for("auth_callback")

    return await oauth.google.authorize_redirect(
        request,
        str(redirect_uri)
    )



@router.get("/google/callback", response_model=UserResponse)
async def auth_callback(request: Request):
    print("Callback reached. Session contains:", request.session)
    token = await oauth.google.authorize_access_token(
        request
    )

    user = token.get("userinfo")
    synced_user = sync_user(user)

    return synced_user