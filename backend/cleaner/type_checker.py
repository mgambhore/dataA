import pandas as pd
import numpy as np
from typing import Tuple


class TypeChecker:
    """Detects and corrects data type mismatches"""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def detect(self) -> dict:
        """Find columns with mixed or wrong types"""
        issues = {}
        for col in self.df.columns:
            col_issues = self._analyze_column(col)
            if col_issues:
                issues[col] = col_issues
        return issues

    def auto_fix(self) -> Tuple[pd.DataFrame, dict]:
        """Automatically coerce columns to correct types"""
        df = self.df.copy()
        fixes = {}

        for col in df.columns:
            original_dtype = str(df[col].dtype)

            # Try numeric conversion
            if df[col].dtype == object:
                cleaned = df[col].astype(str).str.replace(",", "").str.replace("$", "").str.replace("%", "").str.strip()
                numeric_converted = pd.to_numeric(cleaned, errors="coerce")
                non_null_original = df[col].dropna()
                non_null_converted = numeric_converted.dropna()

                # If 70%+ values are numeric, coerce the column
                if len(non_null_original) > 0 and len(non_null_converted) / len(non_null_original) >= 0.7:
                    invalid_vals = df[col][numeric_converted.isna() & df[col].notna()].tolist()
                    df[col] = numeric_converted
                    fixes[col] = {
                        "from": "object",
                        "to": "numeric",
                        "invalid_values_cleared": [str(v) for v in invalid_vals[:10]],
                    }
                    continue

                # Try datetime conversion
                try:
                    dt_converted = pd.to_datetime(df[col], errors="coerce", infer_datetime_format=True)
                    non_null_dt = dt_converted.dropna()
                    if len(non_null_original) > 0 and len(non_null_dt) / len(non_null_original) >= 0.8:
                        df[col] = dt_converted
                        fixes[col] = {
                            "from": "object",
                            "to": "datetime",
                            "invalid_values_cleared": [],
                        }
                        continue
                except Exception:
                    pass

                # Strip whitespace in string columns
                stripped = df[col].astype(str).str.strip()
                if (stripped != df[col].astype(str)).any():
                    df[col] = df[col].apply(lambda x: str(x).strip() if pd.notna(x) else x)
                    fixes[col] = {"from": "object", "to": "object (trimmed)", "invalid_values_cleared": []}

        return df, fixes

    def _analyze_column(self, col: str) -> list:
        issues = []
        series = self.df[col].dropna().astype(str)
        if len(series) == 0:
            return issues

        numeric_count = series.apply(_is_numeric).sum()
        total = len(series)

        if 0 < numeric_count < total * 0.8 and numeric_count > 0:
            non_numeric = series[~series.apply(_is_numeric)].head(5).tolist()
            issues.append({
                "type": "mixed_numeric",
                "message": f"{total - numeric_count} non-numeric values in mostly numeric column",
                "examples": non_numeric,
            })

        whitespace_count = (series != series.str.strip()).sum()
        if whitespace_count > 0:
            issues.append({
                "type": "whitespace",
                "message": f"{whitespace_count} values have leading/trailing spaces",
                "examples": [],
            })

        return issues


def _is_numeric(val: str) -> bool:
    try:
        float(val.replace(",", "").replace("$", "").replace("%", "").strip())
        return True
    except Exception:
        return False
