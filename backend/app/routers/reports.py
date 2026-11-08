from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.entities import GeneratedReport, AuditLog
from app.schemas.schemas import ReportGenerateRequest, ReportResponse
from app.services.report_generator import ReportGeneratorService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Automated Business Reporting"])

@router.post("/generate", response_model=ReportResponse)
def create_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        report_record = ReportGeneratorService.generate_report(
            db=db,
            report_type=req.report_type,
            fmt=req.format,
            period_start=req.period_start,
            period_end=req.period_end,
            route_id=req.route_id,
            user_id=current_user.id if current_user else None
        )

        filename = os.path.basename(report_record.file_path)

        # Audit log
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            action="REPORT_EXPORT",
            resource="generated_reports",
            details_json=f'{{"report_type": "{req.report_type}", "format": "{req.format}", "filename": "{filename}"}}'
        )
        db.add(audit)
        db.commit()

        return ReportResponse(
            id=report_record.id,
            report_type=report_record.report_type,
            title=report_record.title,
            period_start=report_record.period_start,
            period_end=report_record.period_end,
            format=report_record.format,
            file_size_kb=report_record.file_size_kb,
            download_url=f"/api/reports/download/{filename}",
            created_at=report_record.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(GeneratedReport).order_by(GeneratedReport.id.desc()).limit(50).all()
    results = []
    for r in reports:
        filename = os.path.basename(r.file_path)
        results.append(ReportResponse(
            id=r.id,
            report_type=r.report_type,
            title=r.title,
            period_start=r.period_start,
            period_end=r.period_end,
            format=r.format,
            file_size_kb=r.file_size_kb,
            download_url=f"/api/reports/download/{filename}",
            created_at=r.created_at
        ))
    return results

@router.get("/download/{filename}")
def download_report(filename: str):
    file_path = settings.REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested report file was not found")

    ext = filename.split(".")[-1].lower()
    media_map = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv"
    }
    media_type = media_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=media_type
    )
