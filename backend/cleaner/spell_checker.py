import pandas as pd
import re
from typing import Tuple


class SpellChecker:
    """Fixes common formatting and spelling-style issues in string columns"""

    NAME_COLS = {"name", "first name", "last name", "firstname", "lastname",
                 "full name", "fullname", "city", "country", "state", "address"}
    EMAIL_COLS = {"email", "email address", "mail"}

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def detect(self) -> dict:
        """Find formatting issues in string columns"""
        issues = {}
        for col in self.df.select_dtypes(include="object").columns:
            col_issues = []
            for i, val in enumerate(self.df[col]):
                if pd.isna(val):
                    continue
                sv = str(val)
                found = self._check_value(col, sv)
                for f in found:
                    col_issues.append({"row": i, **f})
            if col_issues:
                issues[col] = col_issues[:30]
        return issues

    def fix(self) -> Tuple[pd.DataFrame, dict]:
        """Apply all formatting fixes and return cleaned df + summary"""
        df = self.df.copy()
        fixes = {}

        for col in df.select_dtypes(include="object").columns:
            col_key = col.lower().strip()
            col_fixes = []

            for i in df.index:
                val = df.at[i, col]
                if pd.isna(val):
                    continue
                original = str(val)
                fixed = original

                # 1. Strip whitespace
                fixed = fixed.strip()
                if fixed != original:
                    col_fixes.append({"type": "whitespace", "row": i, "from": original, "to": fixed})

                # 2. Fix name casing
                if any(name_col in col_key for name_col in self.NAME_COLS):
                    title_fixed = _smart_title(fixed)
                    if title_fixed != fixed:
                        col_fixes.append({"type": "casing", "row": i, "from": fixed, "to": title_fixed})
                        fixed = title_fixed

                # 3. Normalize email to lowercase
                if any(email_col in col_key for email_col in self.EMAIL_COLS):
                    lower_fixed = fixed.lower()
                    if lower_fixed != fixed:
                        col_fixes.append({"type": "email_case", "row": i, "from": fixed, "to": lower_fixed})
                        fixed = lower_fixed

                # 4. Remove multiple spaces
                single_space = re.sub(r" {2,}", " ", fixed)
                if single_space != fixed:
                    col_fixes.append({"type": "multi_space", "row": i, "from": fixed, "to": single_space})
                    fixed = single_space

                df.at[i, col] = fixed

            if col_fixes:
                fixes[col] = {
                    "count": len(col_fixes),
                    "types": list({f["type"] for f in col_fixes}),
                    "examples": col_fixes[:5],
                }

        return df, fixes

    def _check_value(self, col: str, val: str) -> list:
        issues = []
        col_key = col.lower().strip()

        if val != val.strip():
            issues.append({"type": "whitespace", "description": "Leading/trailing spaces", "value": val})

        if any(name_col in col_key for name_col in self.NAME_COLS):
            if val.strip() and val.strip()[0].islower():
                issues.append({"type": "casing", "description": "Name not title-cased", "value": val})

        if re.search(r" {2,}", val):
            issues.append({"type": "multi_space", "description": "Multiple consecutive spaces", "value": val})

        return issues


def _smart_title(s: str) -> str:
    """Title-case a string while preserving all-caps abbreviations"""
    words = s.split()
    result = []
    for w in words:
        if w.isupper() and len(w) > 2:
            result.append(w)  # Keep abbreviations like "USA", "HR"
        else:
            result.append(w.capitalize())
    return " ".join(result)
