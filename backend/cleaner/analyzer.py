import pandas as pd
import numpy as np
from typing import Any


class DataAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def null_summary(self) -> dict:
        null_counts = self.df.isnull().sum()
        return {
            col: {
                "count": int(null_counts[col]),
                "percent": round(float(null_counts[col] / len(self.df) * 100), 2),
            }
            for col in self.df.columns
        }

    def duplicate_summary(self) -> dict:
        dup_count = int(self.df.duplicated().sum())
        return {
            "duplicate_rows": dup_count,
            "duplicate_percent": round(dup_count / len(self.df) * 100, 2) if len(self.df) > 0 else 0,
        }

    def type_summary(self) -> dict:
        result = {}
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            non_null = self.df[col].dropna()
            result[col] = {
                "dtype": dtype,
                "inferred": self._infer_type(non_null),
                "unique_count": int(self.df[col].nunique()),
                "sample_values": [str(v) for v in non_null.head(3).tolist()],
            }
        return result

    def spelling_summary(self) -> dict:
        issues = {}
        for col in self.df.select_dtypes(include="object").columns:
            col_issues = []
            for i, val in enumerate(self.df[col]):
                if pd.isna(val):
                    continue
                sv = str(val)
                if sv != sv.strip():
                    col_issues.append({"row": i, "type": "whitespace", "value": sv})
                elif any(c.isupper() for c in sv) and any(c.islower() for c in sv):
                    pass  # mixed case is ok
                elif sv and sv[0].islower() and col.lower() in ["name", "first name", "last name", "city", "country"]:
                    col_issues.append({"row": i, "type": "lowercase", "value": sv})
            if col_issues:
                issues[col] = col_issues[:20]  # limit to 20 per column
        return issues

    def full_report(self) -> dict:
        total_nulls = int(self.df.isnull().sum().sum())
        total_dups = int(self.df.duplicated().sum())
        type_issues = sum(
            1 for col in self.df.columns
            if self._has_type_mismatch(self.df[col])
        )
        spell_issues = sum(
            len(v) for v in self.spelling_summary().values()
        )

        total_issues = total_nulls + total_dups + type_issues + spell_issues
        total_cells = self.df.size
        quality_score = max(0, round(100 - (total_issues / max(total_cells, 1)) * 100 * 5, 1))
        quality_score = min(100, quality_score)

        return {
            "quality_score": quality_score,
            "total_rows": len(self.df),
            "total_columns": len(self.df.columns),
            "total_cells": total_cells,
            "issues": {
                "nulls": {
                    "total": total_nulls,
                    "by_column": self.null_summary(),
                },
                "duplicates": self.duplicate_summary(),
                "type_errors": {
                    "total": type_issues,
                    "by_column": self._type_error_detail(),
                },
                "spelling": {
                    "total": spell_issues,
                    "by_column": self.spelling_summary(),
                },
            },
        }

    def dashboard_data(self) -> dict:
        data = {}

        # Null counts per column
        null_counts = self.df.isnull().sum()
        data["null_by_column"] = {
            "labels": list(null_counts[null_counts > 0].index),
            "values": [int(v) for v in null_counts[null_counts > 0].values],
        }

        # Column types
        type_counts = {"Numeric": 0, "Text": 0, "DateTime": 0, "Boolean": 0, "Other": 0}
        for col in self.df.columns:
            t = self._infer_type(self.df[col].dropna())
            type_counts[t] = type_counts.get(t, 0) + 1
        data["column_types"] = {k: v for k, v in type_counts.items() if v > 0}

        # Numeric column stats
        num_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        data["numeric_stats"] = {}
        for col in num_cols[:5]:
            s = self.df[col].dropna()
            data["numeric_stats"][col] = {
                "min": round(float(s.min()), 2),
                "max": round(float(s.max()), 2),
                "mean": round(float(s.mean()), 2),
                "median": round(float(s.median()), 2),
                "std": round(float(s.std()), 2),
                "histogram": self._histogram(s),
            }

        # Categorical value counts
        cat_cols = self.df.select_dtypes(include="object").columns.tolist()
        data["categorical_counts"] = {}
        for col in cat_cols[:4]:
            vc = self.df[col].value_counts().head(10)
            data["categorical_counts"][col] = {
                "labels": list(vc.index.astype(str)),
                "values": [int(v) for v in vc.values],
            }

        # Quality score summary
        report = self.full_report()
        data["quality"] = {
            "score": report["quality_score"],
            "nulls": report["issues"]["nulls"]["total"],
            "duplicates": report["issues"]["duplicates"]["duplicate_rows"],
            "type_errors": report["issues"]["type_errors"]["total"],
            "spelling": report["issues"]["spelling"]["total"],
        }

        # Row completeness (% of non-null per row, bucketized)
        completeness = (self.df.notnull().sum(axis=1) / len(self.df.columns) * 100).round()
        buckets = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0}
        for v in completeness:
            if v <= 25: buckets["0-25%"] += 1
            elif v <= 50: buckets["25-50%"] += 1
            elif v <= 75: buckets["50-75%"] += 1
            else: buckets["75-100%"] += 1
        data["row_completeness"] = buckets

        return data

    def _infer_type(self, series: pd.Series) -> str:
        if pd.api.types.is_numeric_dtype(series):
            return "Numeric"
        if pd.api.types.is_bool_dtype(series):
            return "Boolean"
        if pd.api.types.is_datetime64_any_dtype(series):
            return "DateTime"
        # Try parsing as date
        try:
            pd.to_datetime(series.head(20), errors="raise")
            return "DateTime"
        except Exception:
            pass
        return "Text"

    def _has_type_mismatch(self, series: pd.Series) -> bool:
        if pd.api.types.is_numeric_dtype(series):
            return False
        non_null = series.dropna().astype(str)
        if len(non_null) == 0:
            return False
        numeric_count = non_null.apply(lambda x: _is_numeric(x)).sum()
        return 0 < numeric_count < len(non_null) * 0.8

    def _type_error_detail(self) -> dict:
        result = {}
        for col in self.df.columns:
            if self._has_type_mismatch(self.df[col]):
                non_null = self.df[col].dropna().astype(str)
                errors = non_null[~non_null.apply(_is_numeric)].head(5).tolist()
                result[col] = {"errors": errors}
        return result

    def _histogram(self, series: pd.Series, bins: int = 8) -> dict:
        try:
            counts, edges = np.histogram(series.dropna(), bins=bins)
            labels = [f"{round(float(edges[i]),1)}-{round(float(edges[i+1]),1)}" for i in range(len(edges)-1)]
            return {"labels": labels, "values": [int(c) for c in counts]}
        except Exception:
            return {"labels": [], "values": []}


def _is_numeric(val: str) -> bool:
    try:
        float(val.replace(",", "").replace("$", "").replace("%", "").strip())
        return True
    except Exception:
        return False
