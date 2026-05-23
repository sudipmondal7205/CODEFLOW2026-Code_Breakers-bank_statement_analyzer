# Install:
# pip install langchain langchain-community langchain-openai pydantic pypdf pandas

from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List
import pandas as pd
import os
# from src.core.llm import model
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()


# architect_model
model=ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)



# Define row structure
class TableRow(BaseModel):
    date: str = Field(description="Date value")
    details: str = Field(description="account details")
    debit: str = Field(description="Debit amount")
    credit: str = Field(description="Credit amount")
    balance: str = Field(description="Balance amount")


# Entire table
class TableData(BaseModel):
    rows: List[TableRow]





def get_file(path):
    # Load PDF
    loader = PyPDFLoader(path)
    docs = loader.load()
    
    
    # Merge pages
    pdf_text = "\n".join(
        doc.page_content
        for doc in docs
    )
    
    
    # Initialize LLM
    
    
    
    # Force structured output
    structured_llm = model.with_structured_output(
        TableData
    )
    
    
    prompt = f"""
    Extract table data from the PDF text.
    
    Rules:
    
    1. Detect table columns automatically
    2. Return each row separately
    3. Preserve values exactly
    4. Keep missing fields empty
    5. Ignore unrelated text
    6. Extract only table content
    
    PDF:
    
    {pdf_text}
    """

    result = structured_llm.invoke(prompt)
    
    print("\nStructured output:")
    print(result)
    
    
    # Convert to DataFrame
    data = [
        row.model_dump()
        for row in result.rows
    ]
    
    return data