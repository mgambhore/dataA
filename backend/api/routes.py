from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import json
from cleaner.null_handler import NullHandler
from cleaner.duplicate_checker import DuplicateChecker
from cleaner.type_checker import TypeChecker
from cleaner.spell_checker import SpellChecker
from cleaner.analyzer import DataAnalyzer
from utils.file_parser import parse_upload

router = APIRouter()

# In-memory session store (use Redis in production)
sessions: dict = {}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV or Excel file and return analysis"""
    try:
        df = await parse_upload(file)
        session_id = file.filename + "_" + str(len(df))
        sessions[session_id] = df.copy()

        analyzer = DataAnalyzer(df)
        report = analyzer.full_report()

        return {
            "session_id": session_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "preview": df.head(50).fillna("").astype(str).to_dict(orient="records"),
            "report": report,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/fix/nulls")
async def fix_nulls(body: dict = Body(...)):
    session_id = body.get("session_id")
    strategy = body.get("strategy", "auto")  # auto | mean | median | mode | drop | custom
    custom_value = body.get("custom_value", None)
    columns = body.get("columns", None)  # None means all columns

    df = _get_session(session_id)
    handler = NullHandler(df)
    df_clean = handler.fix(strategy=strategy, columns=columns, custom_value=custom_value)
    sessions[session_id] = df_clean

    analyzer = DataAnalyzer(df_clean)
    return {
        "rows": len(df_clean),
        "null_summary": analyzer.null_summary(),
        "preview": df_clean.head(50).fillna("").astype(str).to_dict(orient="records"),
        "fixed_count": handler.fixed_count,
    }


@router.post("/fix/duplicates")
async def fix_duplicates(body: dict = Body(...)):
    session_id = body.get("session_id")
    subset = body.get("subset", None)  # columns to consider for dup detection

    df = _get_session(session_id)
    checker = DuplicateChecker(df)
    df_clean = checker.remove(subset=subset)
    sessions[session_id] = df_clean

    return {
        "rows_before": len(df),
        "rows_after": len(df_clean),
        "removed": len(df) - len(df_clean),
        "preview": df_clean.head(50).fillna("").astype(str).to_dict(orient="records"),
    }


@router.post("/fix/types")
async def fix_types(body: dict = Body(...)):
    session_id = body.get("session_id")
    df = _get_session(session_id)
    checker = TypeChecker(df)
    df_clean, fixes = checker.auto_fix()
    sessions[session_id] = df_clean

    return {
        "fixes": fixes,
        "dtypes": {col: str(dtype) for col, dtype in df_clean.dtypes.items()},
        "preview": df_clean.head(50).fillna("").astype(str).to_dict(orient="records"),
    }


@router.post("/fix/spelling")
async def fix_spelling(body: dict = Body(...)):
    session_id = body.get("session_id")
    df = _get_session(session_id)
    checker = SpellChecker(df)
    df_clean, fixes = checker.fix()
    sessions[session_id] = df_clean

    return {
        "fixes": fixes,
        "preview": df_clean.head(50).fillna("").astype(str).to_dict(orient="records"),
    }


@router.post("/fix/all")
async def fix_all(body: dict = Body(...)):
    session_id = body.get("session_id")
    df = _get_session(session_id)

    results = {}

    # 1. Remove duplicates
    checker = DuplicateChecker(df)
    df = checker.remove()
    results["duplicates_removed"] = checker.removed_count

    # 2. Fix types
    type_checker = TypeChecker(df)
    df, type_fixes = type_checker.auto_fix()
    results["type_fixes"] = type_fixes

    # 3. Fix spelling/formatting
    spell = SpellChecker(df)
    df, spell_fixes = spell.fix()
    results["spell_fixes"] = spell_fixes

    # 4. Handle nulls last (after type fixes)
    null_handler = NullHandler(df)
    df = null_handler.fix(strategy="auto")
    results["nulls_filled"] = null_handler.fixed_count

    sessions[session_id] = df
    analyzer = DataAnalyzer(df)

    return {
        "results": results,
        "rows": len(df),
        "report": analyzer.full_report(),
        "preview": df.head(50).fillna("").astype(str).to_dict(orient="records"),
    }


@router.get("/report/{session_id}")
async def get_report(session_id: str):
    df = _get_session(session_id)
    analyzer = DataAnalyzer(df)
    return analyzer.full_report()


@router.get("/dashboard/{session_id}")
async def get_dashboard(session_id: str):
    df = _get_session(session_id)
    analyzer = DataAnalyzer(df)
    return analyzer.dashboard_data()


@router.get("/export/{session_id}")
async def export_csv(session_id: str):
    df = _get_session(session_id)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_data.csv"},
    )


def _get_session(session_id: str) -> pd.DataFrame:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please re-upload your file.")
    return sessions[session_id].copy()
