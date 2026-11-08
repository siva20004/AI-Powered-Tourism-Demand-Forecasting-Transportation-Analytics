import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import ForecastingModel, AuditLog
from app.schemas.schemas import ForecastResponse, ModelMetric, RetrainRequest
from app.services.ml_engine import MLEngineService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/forecasting", tags=["AI Demand Forecasting"])

@router.get("/predict", response_model=ForecastResponse)
def get_prediction(
    horizon_days: int = Query(7, ge=1, le=30),
    route_id: Optional[int] = None,
    model_type: str = Query("gradient_boosting", pattern="^(gradient_boosting|random_forest|ridge_baseline)$"),
    db: Session = Depends(get_db)
):
    try:
        forecast = MLEngineService.generate_forecast(
            db=db,
            route_id=route_id,
            horizon_days=horizon_days,
            model_type=model_type
        )
        return forecast
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/models", response_model=List[ModelMetric])
def list_models(db: Session = Depends(get_db)):
    models = db.query(ForecastingModel).order_by(ForecastingModel.id.desc()).all()
    results = []
    for m in models:
        params = {}
        if m.parameters_json:
            try:
                params = json.loads(m.parameters_json)
            except Exception:
                pass
        results.append(ModelMetric(
            id=m.id,
            model_name=m.model_name,
            model_type=m.model_type,
            mae=m.mae,
            rmse=m.rmse,
            r2=m.r2,
            is_active=m.is_active,
            training_end_date=m.training_end_date,
            parameters=params
        ))
    return results

@router.post("/retrain")
def retrain_model(
    req: RetrainRequest,
    route_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        model_obj, eval_summary = MLEngineService.train_and_evaluate(
            db=db,
            route_id=route_id,
            model_type=req.model_type
        )

        # Audit log
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            action="MODEL_RETRAIN",
            resource="forecasting_models",
            details_json=json.dumps(eval_summary)
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully retrained {req.model_type} model.",
            "metrics": eval_summary
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
