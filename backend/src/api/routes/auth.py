# Session middleware required
from fastapi import Request
from starlette.responses import JSONResponse
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
import os
from fastapi import APIRouter
from dotenv import load_dotenv

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
    print("Hello!!!")
    redirect_uri = request.url_for(
        "auth_callback"
    )

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )



@router.get("/google/callback")
async def auth_callback(request: Request):

    token = await oauth.google.authorize_access_token(
        request
    )

    user = token.get("userinfo")

    return JSONResponse({
        "name": user["name"],
        "email": user["email"],
        "picture": user["picture"]
    })