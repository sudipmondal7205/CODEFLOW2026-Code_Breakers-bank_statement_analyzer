import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from src.services.statement_service import process_uploaded_statement, generate_and_store_ai_analysis
from src.core.security import get_current_user
from src.schemas import AiAnalysisResponse

router = APIRouter()

TEMP_DIR = "data"

@router.post("/upload")
def upload_statement(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Endpoint to upload a bank statement document (PDF).
    It parses the document, calculates metrics, saves to MongoDB, and returns the analysis.
    """
    if not file.filename.endswith(('.pdf', '.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid extension format. Provide a standard document.")

    os.makedirs(TEMP_DIR, exist_ok=True)
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = process_uploaded_statement(temp_file_path, file.filename, user_id)
        return result
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@router.post("/{statement_id}/ai-analysis", response_model=AiAnalysisResponse)
def create_ai_analysis(
    statement_id: str,
    user_id: str = Depends(get_current_user),
):
    """Generate AI analysis for a statement, persist it, and return the result."""
    return generate_and_store_ai_analysis(statement_id, user_id)
