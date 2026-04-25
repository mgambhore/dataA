import pandas as pd
from typing import Optional, List


class DuplicateChecker:
    """Detects and removes duplicate rows"""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.removed_count = 0

    def detect(self, subset: Optional[List[str]] = None) -> dict:
        """Return duplicate row info"""
        dup_mask = self.df.duplicated(subset=subset, keep="first")
        dup_rows = dup_mask[dup_mask].index.tolist()
        return {
            "count": len(dup_rows),
            "rows": dup_rows[:50],
            "percent": round(len(dup_rows) / len(self.df) * 100, 2) if len(self.df) > 0 else 0,
        }

    def remove(self, subset: Optional[List[str]] = None, keep: str = "first") -> pd.DataFrame:
        """Remove duplicate rows, keeping first occurrence"""
        before = len(self.df)
        df_clean = self.df.drop_duplicates(subset=subset, keep=keep).reset_index(drop=True)
        self.removed_count = before - len(df_clean)
        return df_clean

    def find_near_duplicates(self, col: str, threshold: float = 0.85) -> list:
        """Find near-duplicate strings in a text column using simple similarity"""
        from difflib import SequenceMatcher
        values = self.df[col].dropna().unique().tolist()
        pairs = []
        for i in range(len(values)):
            for j in range(i + 1, len(values)):
                ratio = SequenceMatcher(None, str(values[i]), str(values[j])).ratio()
                if ratio >= threshold:
                    pairs.append({
                        "value1": values[i],
                        "value2": values[j],
                        "similarity": round(ratio, 3),
                    })
        return pairs[:20]
