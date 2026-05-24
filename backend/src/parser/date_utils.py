import re
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

DATE_FORMATS = (
    "%d/%m/%y",
    "%d/%m/%Y",
    "%d-%m-%y",
    "%d-%m-%Y",
    "%Y-%m-%d",
    "%d %b %Y",
    "%d-%b-%Y",
)

DATE_IN_TEXT = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b")

POST_DATE_KEYS = frozenset(
    {"post_date", "postdate", "post", "transaction_date", "txn_date", "trans_date"}
)
VALUE_DATE_KEYS = frozenset({"value_date", "valuedate", "value"})
DATE_KEYS = frozenset({"date"})


def _norm_key(key: str) -> str:
    return key.strip().lower().replace(".", "").replace(" ", "_")


def find_date_in_text(text: Optional[str]) -> Optional[datetime]:
    if not text:
        return None
    match = DATE_IN_TEXT.search(str(text).strip())
    if not match:
        return None
    return parse_bank_date(match.group(1))


def parse_bank_date(value: Optional[Any]) -> Optional[datetime]:
    """Parse Indian bank statement dates (e.g. 01/01/25, 04/01/25)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return find_date_in_text(text)


def extract_row_dates(row: Dict[str, Any]) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Pull post date and value date from a parsed row.
    Checks known column names, then scans non-amount fields for date patterns.
    """
    post_raw = ""
    value_raw = ""
    date_raw = ""

    for key, val in row.items():
        if val is None or val == "":
            continue
        key_norm = _norm_key(str(key))
        text = str(val).strip()
        if not text:
            continue
        if key_norm in POST_DATE_KEYS:
            post_raw = text
        elif key_norm in VALUE_DATE_KEYS:
            value_raw = text
        elif key_norm in DATE_KEYS:
            date_raw = text

    post_dt = parse_bank_date(post_raw) or parse_bank_date(date_raw)
    value_dt = parse_bank_date(value_raw)

    if post_dt and value_dt:
        return post_dt, value_dt

    skip_keys = {
        "details",
        "description",
        "narration",
        "debit",
        "credit",
        "balance",
        "chq_no",
        "chq",
        "cheque",
    }
    found_dates: list[datetime] = []
    for key, val in row.items():
        key_norm = _norm_key(str(key))
        if key_norm in skip_keys:
            continue
        if key_norm in POST_DATE_KEYS | VALUE_DATE_KEYS | DATE_KEYS:
            continue
        parsed = parse_bank_date(val)
        if parsed and parsed not in found_dates:
            found_dates.append(parsed)

    if not post_dt and found_dates:
        post_dt = found_dates[0]
    if not value_dt and len(found_dates) >= 2:
        value_dt = found_dates[1]
    elif not value_dt and post_dt:
        value_dt = parse_bank_date(value_raw)

    if post_dt and not value_dt:
        value_dt = post_dt
    if value_dt and not post_dt:
        post_dt = value_dt

    return post_dt, value_dt
