import csv
import re
from typing import Any, Dict, List

SKIP_DETAILS = re.compile(
    r"brought\s+forward|carried\s+forward|opening\s+balance|closing\s+balance",
    re.IGNORECASE,
)


def _norm_header(header: str) -> str:
    return header.strip().lower().replace(".", "").replace(" ", "_")


def _map_headers(fieldnames: List[str]) -> Dict[str, str]:
    """Map normalized header -> original header name."""
    return {_norm_header(h): h for h in fieldnames if h}


def parse_csv_statement(path: str) -> List[Dict[str, Any]]:
    """
    Parse structured bank CSV with Post Date / Value Date columns.
    Returns empty list if the file is not a recognizable statement CSV.
    """
    rows: List[Dict[str, Any]] = []

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return []

        header_map = _map_headers(list(reader.fieldnames))
        norm_keys = set(header_map.keys())

        has_dates = any(
            k in norm_keys
            for k in ("post_date", "value_date", "date", "txn_date", "transaction_date")
        )
        has_amounts = "debit" in norm_keys or "credit" in norm_keys
        if not has_dates or not has_amounts:
            return []

        def col(*names: str) -> str:
            for name in names:
                if name in header_map:
                    return (reader_row.get(header_map[name]) or "").strip()
            return ""

        for reader_row in reader:
            details = col("details", "description", "narration", "particulars")
            if not details or SKIP_DETAILS.search(details):
                continue

            debit = col("debit", "withdrawal", "dr")
            credit = col("credit", "deposit", "cr")
            if not debit and not credit:
                continue

            rows.append(
                {
                    "post_date": col("post_date", "postdate", "transaction_date", "txn_date", "date"),
                    "value_date": col("value_date", "valuedate"),
                    "date": col("date"),
                    "details": details,
                    "debit": debit,
                    "credit": credit,
                    "balance": col("balance", "bal"),
                }
            )

    return rows
