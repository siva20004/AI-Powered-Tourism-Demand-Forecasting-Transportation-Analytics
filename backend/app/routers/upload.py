import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.entities import UploadedDataset, DataQualityLog, AuditLog
from app.schemas.schemas import QualityReport, DatasetResponse, QualityIssue
from app.services.data_cleaning import DataCleaningService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Data Upload & ETL Pipeline"])

@router.post("", response_model=QualityReport)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename provided")

    contents = await file.read()
    try:
        dataset_record, report, clean_path = DataCleaningService.inspect_and_clean_file(
            file_bytes=contents,
            filename=file.filename,
            db=db,
            user_id=current_user.id if current_user else None
        )

        # Audit log
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            action="UPLOAD_AND_CLEAN",
            resource="datasets",
            details_json=f'{{"filename": "{file.filename}", "rows": {report["total_rows"]}, "quality_score": {report["data_quality_score_pct"]}}}'
        )
        db.add(audit)
        db.commit()

        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/datasets", response_model=List[DatasetResponse])
def get_datasets(db: Session = Depends(get_db)):
    return db.query(UploadedDataset).order_by(UploadedDataset.id.desc()).all()

@router.get("/quality-logs/{dataset_id}")
def get_dataset_quality_logs(dataset_id: int, db: Session = Depends(get_db)):
    logs = db.query(DataQualityLog).filter(DataQualityLog.dataset_id == dataset_id).all()
    return logs

@router.get("/download/{filename}")
def download_cleaned_file(filename: str):
    file_path = settings.CLEANED_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="text/csv"
    )

@router.get("/sample/{sample_type}")
def download_sample_data(sample_type: str = "csv"):
    """
    Provides a pre-built sample dataset (CSV or XLSX) with intentional quirks
    (missing values, minor duplicate) so users can witness the ETL cleaning in action.
    """
    ext = "xlsx" if sample_type.lower() in ["xlsx", "excel"] else "csv"
    sample_file = settings.SAMPLES_DIR / f"sample_fuji_passenger_upload.{ext}"

    if not sample_file.exists():
        raise HTTPException(status_code=404, detail=f"Sample {ext.upper()} file not initialized yet.")

    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if ext == "xlsx" else "text/csv"
    return FileResponse(
        path=str(sample_file),
        filename=f"fujitrack_sample_data.{ext}",
        media_type=media_type
    )
