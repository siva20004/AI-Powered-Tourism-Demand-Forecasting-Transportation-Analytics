from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.models.entities import Route, PassengerRecord, Station, Bus
from app.schemas.schemas import RouteResponse

router = APIRouter(prefix="/routes", tags=["Route Performance Analytics"])

@router.get("", response_model=List[RouteResponse])
def get_all_routes(db: Session = Depends(get_db)):
    return db.query(Route).filter(Route.is_active == True).all()

@router.get("/{route_id}/performance")
def get_route_performance(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    pax_stats = db.query(
        func.sum(PassengerRecord.passenger_count).label("total_pax"),
        func.avg(PassengerRecord.passenger_count).label("avg_slot_pax"),
        func.count(PassengerRecord.date.distinct()).label("operating_days")
    ).filter(PassengerRecord.route_id == route_id).first()

    total_pax = int(pax_stats.total_pax or 0)
    operating_days = int(pax_stats.operating_days or 1)
    avg_daily_pax = int(total_pax / operating_days)

    # Hourly distribution for peak detection
    hourly = db.query(
        PassengerRecord.hour,
        func.sum(PassengerRecord.passenger_count).label("hour_pax")
    ).filter(PassengerRecord.route_id == route_id)\
     .group_by(PassengerRecord.hour)\
     .order_by(desc("hour_pax")).all()

    peak_hour = f"{hourly[0].hour:02d}:00 - {hourly[0].hour + 1:02d}:00" if hourly else "10:00 - 11:00"

    # Overall system rank
    all_routes = db.query(
        PassengerRecord.route_id,
        func.sum(PassengerRecord.passenger_count).label("pax")
    ).group_by(PassengerRecord.route_id)\
     .order_by(desc("pax")).all()

    rank = 1
    for idx, r in enumerate(all_routes):
        if r.route_id == route_id:
            rank = idx + 1
            break

    # Route utilization (assuming standard 6 dedicated buses of 60 cap each)
    standard_capacity = 6 * 60 * 8  # 8 trips/day
    utilization_pct = round((avg_daily_pax / standard_capacity) * 100.0, 1)

    congestion_badge = "High Congestion / 増便推奨" if utilization_pct >= 90 else (
        "Standard / 安定稼働" if utilization_pct >= 60 else "Low Demand / ダイヤ見直し検討"
    )

    return {
        "route_id": route.id,
        "route_code": route.route_code,
        "name_ja": route.name_ja,
        "name_en": route.name_en,
        "origin_station": route.origin_station,
        "destination_station": route.destination_station,
        "distance_km": route.distance_km,
        "standard_duration_min": route.standard_duration_min,
        "total_passengers": total_pax,
        "avg_daily_passengers": avg_daily_pax,
        "peak_hour": peak_hour,
        "system_demand_rank": f"#{rank} of {len(all_routes)}",
        "estimated_utilization_pct": utilization_pct,
        "congestion_badge": congestion_badge
    }
