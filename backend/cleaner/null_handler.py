import pandas as pd
import numpy as np
from typing import Optional, List


class NullHandler:
    """Handles detection and fixing of null/missing values"""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.fixed_count = 0

    def detect(self) -> dict:
        """Return null counts and positions per column"""
        result = {}
        for col in self.df.columns:
            null_mask = self.df[col].isnull() | (self.df[col].astype(str).str.strip().isin(["", "null", "NULL", "None", "N/A", "n/a", "NA", "undefined", "NaN"]))
            rows = null_mask[null_mask].index.tolist()
            if rows:
                result[col] = {"count": len(rows), "rows": rows[:20]}
        return result

    def fix(
        self,
        strategy: str = "auto",
        columns: Optional[List[str]] = None,
        custom_value=None,
    ) -> pd.DataFrame:
        """
        Fix null values using a strategy.
        Strategies: auto | mean | median | mode | drop | custom | empty_string
        """
        df = self.df.copy()
        cols = columns if columns else df.columns.tolist()

        # First normalize common null representations
        for col in cols:
            df[col] = df[col].replace(["null", "NULL", "None", "N/A", "n/a", "NA", "undefined", "NaN", ""], np.nan)

        for col in cols:
            null_mask = df[col].isnull()
            null_count = null_mask.sum()
            if null_count == 0:
                continue

            if strategy == "drop":
                df = df.dropna(subset=[col])
                self.fixed_count += null_count
                continue

            if strategy == "custom" and custom_value is not None:
                df[col] = df[col].fillna(custom_value)
                self.fixed_count += null_count
                continue

            if strategy == "empty_string":
                df[col] = df[col].fillna("")
                self.fixed_count += null_count
                continue

            # Auto or explicit strategy
            fill_value = self._compute_fill(df[col], strategy)
            if fill_value is not None:
                df[col] = df[col].fillna(fill_value)
                self.fixed_count += null_count

        return df

    def _compute_fill(self, series: pd.Series, strategy: str):
        non_null = series.dropna()
        if len(non_null) == 0:
            return None

        is_numeric = pd.api.types.is_numeric_dtype(series)

        if strategy == "mean" and is_numeric:
            return round(float(non_null.mean()), 4)
        if strategy == "median" and is_numeric:
            return round(float(non_null.median()), 4)
        if strategy == "mode":
            mode = non_null.mode()
            return mode[0] if len(mode) > 0 else None

        # Auto strategy
        if is_numeric:
            return round(float(non_null.mean()), 4)
        else:
            mode = non_null.mode()
            return mode[0] if len(mode) > 0 else "Unknown"
