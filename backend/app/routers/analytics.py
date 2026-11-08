from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.database import get_db
from app.models.entities import PassengerRecord, Route, Station, Bus
from app.schemas.schemas import PeakHourStat

router = APIRouter(prefix="/analytics", tags=["Passenger Traffic Analytics"])

@router.get("/daily")
def get_daily_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    route_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        PassengerRecord.date,
        func.sum(PassengerRecord.passenger_count).label("total_passengers"),
        func.sum(PassengerRecord.boardings).label("total_boardings"),
        func.sum(PassengerRecord.alightings).label("total_alightings")
    )
    if start_date:
        query = query.filter(PassengerRecord.date >= start_date)
    if end_date:
        query = query.filter(PassengerRecord.date <= end_date)
    if route_id:
        query = query.filter(PassengerRecord.route_id == route_id)

    rows = query.group_by(PassengerRecord.date).order_by(PassengerRecord.date).all()
    return [
        {
            "date": r.date.strftime("%Y-%m-%d"),
            "passengers": int(r.total_passengers),
            "boardings": int(r.total_boardings or 0),
            "alightings": int(r.total_alightings or 0)
        }
        for r in rows
    ]

@router.get("/monthly")
def get_monthly_analytics(route_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(
        extract("year", PassengerRecord.date).label("year"),
        extract("month", PassengerRecord.date).label("month"),
        func.sum(PassengerRecord.passenger_count).label("passengers")
    )
    if route_id:
        query = query.filter(PassengerRecord.route_id == route_id)

    rows = query.group_by("year", "month").order_by("year", "month").all()
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "label": f"{int(r.year)} {month_names[int(r.month) - 1]}",
            "passengers": int(r.passengers)
        }
        for r in rows
    ]

@router.get("/peak-hours", response_model=List[PeakHourStat])
def get_peak_hours(route_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(
        PassengerRecord.hour,
        func.sum(PassengerRecord.passenger_count).label("pax"),
        func.avg(PassengerRecord.boardings).label("avg_boardings")
    )
    if route_id:
        query = query.filter(PassengerRecord.route_id == route_id)

    rows = query.group_by(PassengerRecord.hour).order_by(PassengerRecord.hour).all()
    return [
        PeakHourStat(
            hour=int(r.hour),
            hour_label=f"{int(r.hour):02d}:00",
            passenger_count=int(r.pax),
            avg_boardings=round(float(r.avg_boardings or 0), 1)
        )
        for r in rows
    ]

@router.get("/weekend-vs-weekday")
def get_weekend_vs_weekday(route_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(
        PassengerRecord.date,
        func.sum(PassengerRecord.passenger_count).label("daily_pax")
    )
    if route_id:
        query = query.filter(PassengerRecord.route_id == route_id)

    rows = query.group_by(PassengerRecord.date).all()
    weekday_counts = []
    weekend_counts = []

    for r in rows:
        if r.date.weekday() in [5, 6]:
            weekend_counts.append(r.daily_pax)
        else:
            weekday_counts.append(r.daily_pax)

    avg_wkday = sum(weekday_counts) / len(weekday_counts) if weekday_counts else 0
    avg_wknd = sum(weekend_counts) / len(weekend_counts) if weekend_counts else 0
    diff_pct = round(((avg_wknd - avg_wkday) / (avg_wkday or 1)) * 100, 1)

    return {
        "weekday_average": round(avg_wkday, 1),
        "weekend_average": round(avg_wknd, 1),
        "difference_pct": diff_pct,
        "weekend_surge_description": f"週末の輸送需要は平日比 +{diff_pct}% 増加 (観光旅客集中)"
    }
