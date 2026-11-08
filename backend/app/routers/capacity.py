import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.entities import CapacityRecommendation, Route, PassengerRecord, AuditLog
from app.schemas.schemas import (
    CapacitySimulateRequest, CapacitySimulateResponse, ManagerStatusUpdate
)
from app.services.capacity_engine import CapacityEngineService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/capacity", tags=["Smart Bus Capacity Planning"])

@router.post("/simulate", response_model=CapacitySimulateResponse)
def simulate_capacity(
    req: CapacitySimulateRequest,
    db: Session = Depends(get_db)
):
    # If predicted_passengers not passed, estimate from recent average
    pax_val = req.predicted_passengers
    if not pax_val or pax_val <= 0:
        recent_avg = db.query(func.avg(PassengerRecord.passenger_count)).filter(
            PassengerRecord.route_id == req.route_id
        ).scalar()
        pax_val = int(recent_avg * 12) if recent_avg else 1200  # 12 daily hours equivalent

    result = CapacityEngineService.calculate_recommendation(
        db=db,
        route_id=req.route_id,
        predicted_passengers=pax_val,
        available_buses=req.available_buses,
        bus_capacity=req.bus_capacity,
        safety_margin_pct=req.safety_margin_pct
    )
    return result

@router.get("/recommendations")
def list_recommendations(limit: int = 30, db: Session = Depends(get_db)):
    recs = db.query(CapacityRecommendation).order_by(CapacityRecommendation.id.desc()).limit(limit).all()
    results = []
    for r in recs:
        route = db.query(Route).filter(Route.id == r.route_id).first()
        results.append({
            "id": r.id,
            "date": r.date.strftime("%Y-%m-%d"),
            "route_id": r.route_id,
            "route_name": route.name_ja if route else f"Route #{r.route_id}",
            "predicted_demand": r.predicted_demand,
            "available_buses": r.available_buses,
            "required_buses": r.required_buses,
            "additional_buses_needed": max(0, r.required_buses - r.available_buses),
            "safety_margin_pct": r.safety_margin_pct,
            "overcrowding_risk": r.overcrowding_risk,
            "manager_status": r.manager_status,
            "manager_note": r.manager_note,
            "created_at": r.created_at
        })
    return results

@router.put("/status")
def update_recommendation_status(
    update: ManagerStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rec = db.query(CapacityRecommendation).filter(CapacityRecommendation.id == update.recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation record not found")

    rec.manager_status = update.status
    rec.manager_note = update.manager_note
    
    note_str = update.manager_note or ""
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="CAPACITY_DISPATCH_SIGN_OFF",
        resource="capacity_recommendations",
        details_json=json.dumps({"recommendation_id": rec.id, "status": update.status, "note": note_str})
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"Recommendation #{rec.id} marked as {update.status}"}
