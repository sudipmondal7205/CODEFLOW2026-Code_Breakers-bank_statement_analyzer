from fastapi import FastAPI, APIRouter


app = FastAPI()
router = APIRouter()


@router.get("/health-check")
def health_check():
    return "OK"


app.include_router(router)