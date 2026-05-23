import os
from typing import List
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, TextLoader
from pydantic import BaseModel, Field

from src.core.llm import model


class TableRow(BaseModel):
    date: str = Field(description="Date value")
    details: str = Field(description="account details")
    debit: str = Field(description="Debit amount")
    credit: str = Field(description="Credit amount")
    balance: str = Field(description="Balance amount")


class TableData(BaseModel):
    rows: List[TableRow]


def get_file(path):
    ext = os.path.splitext(path)[1].lower()
    
    if ext == '.pdf':
        loader = PyPDFLoader(path)
    elif ext == '.csv':
        loader = CSVLoader(path)
    else:
        loader = TextLoader(path, encoding='utf-8')
        
    docs = loader.load()

    file_text = "\n".join(doc.page_content for doc in docs)

    structured_llm = model.with_structured_output(TableData)

    prompt = f"""
    Extract table data from the document text.

    Rules:

    1. Detect table columns automatically
    2. Return each row separately
    3. Preserve values exactly
    4. Keep missing fields empty
    5. Ignore unrelated text
    6. Extract only table content

    Document:

    {file_text}
    """

    result = structured_llm.invoke(prompt)

    return [row.model_dump() for row in result.rows]
