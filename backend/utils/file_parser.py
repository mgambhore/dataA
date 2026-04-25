import pandas as pd
import io
from fastapi import UploadFile, HTTPException


async def parse_upload(file: UploadFile) -> pd.DataFrame:
    """Parse uploaded CSV or Excel file into DataFrame"""
    content = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            # Try multiple encodings
            for encoding in ["utf-8", "latin-1", "cp1252"]:
                try:
                    df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue

        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload CSV or Excel (.xlsx/.xls)"
            )

        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")

        # Strip whitespace from column names
        df.columns = df.columns.str.strip()

        return df

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
