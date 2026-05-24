import os
from typing import List
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, TextLoader
from pydantic import BaseModel, Field
from fastapi import HTTPException

from src.core.llm import model


class TableRow(BaseModel):
    post_date: str = Field(default="", description="Post date column (e.g. 01/01/25)")
    value_date: str = Field(default="", description="Value date column (e.g. 01/01/25)")
    date: str = Field(default="", description="Single date column if post/value not separate")
    details: str = Field(description="Transaction narration / details")
    debit: str = Field(default="", description="Debit amount")
    credit: str = Field(default="", description="Credit amount")
    balance: str = Field(default="", description="Balance amount")


class TableData(BaseModel):
    rows: List[TableRow]


def get_file(path):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".csv":
        from src.parser.csv_parse import parse_csv_statement

        csv_rows = parse_csv_statement(path)
        if csv_rows:
            return csv_rows

    if ext == '.pdf':
        loader = PyPDFLoader(path)
    elif ext == '.csv':
        loader = CSVLoader(path)
    else:
        loader = TextLoader(path, encoding='utf-8')

    docs = loader.load()
    if len(docs) > 5:
            raise HTTPException(
                status_code=400,
                detail="PDF cannot contain more than 5 pages"
            )
    file_text = "\n".join(doc.page_content for doc in docs)

    if ext == ".pdf":
        from src.parser.pdf_text_parse import parse_pdf_text_transactions

        pdf_rows = parse_pdf_text_transactions(file_text)
        if pdf_rows:
            return pdf_rows

    structured_llm = model.with_structured_output(TableData)

    prompt = f"""
    Extract bank statement table rows from the document text.

    Rules:

    1. Detect table columns automatically (Post Date, Value Date, Details, Debit, Credit, Balance, etc.)
    2. REQUIRED: Every transaction row MUST include post_date (from "Post Date" column, DD/MM/YY e.g. 01/01/25)
    3. REQUIRED: Include value_date when a "Value Date" column exists (e.g. 01/01/25)
    4. If only one date column exists, copy it to both post_date and value_date
    5. Skip rows without a real transaction (e.g. "Brought Forward", "Carried Forward", opening/closing balance)
    6. Return each transaction row separately
    7. Preserve amounts and dates exactly as printed in the statement
    8. Never leave post_date empty for a valid transaction row
    9. Ignore headers, footers, and unrelated text

    Document:

    {file_text}
    """

    result = structured_llm.invoke(prompt)

    return [row.model_dump() for row in result.rows]
