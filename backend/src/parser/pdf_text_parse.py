import re
from typing import Any, Dict, List, Optional, Tuple

from src.parser.csv_parse import SKIP_DETAILS

ROW_START = re.compile(
    r"(\d{1,2}/\d{1,2}/\d{2,4})\s+(\d{1,2}/\d{1,2}/\d{2,4})\s+",
)
AMOUNT = re.compile(r"([\d,]+\.\d{2})")


def _looks_like_credit(block: str) -> bool:
    lower = block.lower()
    if any(h in lower for h in ("/dr/", " debit", "withdrawal", "charged", "debit")):
        return False
    if any(
        h in lower
        for h in ("inward", "credited", "credit", "reversal", "salary", "/cr/")
    ):
        return True
    return False


def _last_amounts(text: str) -> Tuple[str, str, str]:
    """Extract debit, credit, balance from the tail of a transaction block."""
    amounts = [a.replace(",", "") for a in AMOUNT.findall(text)]
    if not amounts:
        return "", "", ""

    balance = amounts[-1]
    if len(amounts) >= 3:
        return amounts[-3], amounts[-2], balance
    if len(amounts) == 2:
        txn_amt = amounts[-2]
        if _looks_like_credit(text):
            return "", txn_amt, balance
        return txn_amt, "", balance
    if _looks_like_credit(text):
        return "", amounts[0], ""
    return amounts[0], "", ""


def parse_pdf_text_transactions(text: str) -> List[Dict[str, Any]]:
    """
    Extract rows from PDF text where each transaction starts with
    post date and value date (e.g. 01/01/25 01/01/25 ...).
    """
    if not text or not ROW_START.search(text):
        return []

    rows: List[Dict[str, Any]] = []
    matches = list(ROW_START.finditer(text))

    for i, match in enumerate(matches):
        post_date = match.group(1)
        value_date = match.group(2)
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end].strip()
        if not block or SKIP_DETAILS.search(block):
            continue

        details = re.sub(r"\s+", " ", block)
        debit, credit, balance = _last_amounts(block)

        if not debit and not credit:
            continue

        rows.append(
            {
                "post_date": post_date,
                "value_date": value_date,
                "details": details,
                "debit": debit,
                "credit": credit,
                "balance": balance,
            }
        )

    return rows
