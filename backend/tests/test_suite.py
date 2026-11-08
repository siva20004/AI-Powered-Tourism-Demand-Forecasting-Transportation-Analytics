import pytest
import os
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models.entities import Route, Bus, PassengerRecord, User
from app.services.data_cleaning import DataCleaningService
from app.services.capacity_engine import CapacityEngineService
from app.services.ml_engine import MLEngineService
from app.services.insights_engine import InsightsEngineService

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_dashboard_summary(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_passengers_today" in data
    assert "predicted_passengers_tomorrow" in data
    assert "bus_utilization_pct" in data
    assert len(data["high_demand_routes"]) > 0

def test_routes_list(client):
    response = client.get("/api/routes")
    assert response.status_code == 200
    routes = response.json()
    assert len(routes) >= 6
    codes = [r["route_code"] for r in routes]
    assert "ROUTE-FS5" in codes
    assert "ROUTE-KWR" in codes

def test_auth_login(client):
    # Test admin login
    resp = client.post("/api/auth/login", json={
        "email": "admin@fujikyu.co.jp",
        "password": "admin123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_capacity_engine_calculation(db_session):
    # Test standard capacity scenario: 1200 demand, 15 buses (900 cap), 15% safety buffer
    res = CapacityEngineService.calculate_recommendation(
        db=db_session,
        route_id=1,
        predicted_passengers=1200,
        available_buses=15,
        bus_capacity=60,
        safety_margin_pct=15.0
    )
    assert res["predicted_passengers"] == 1200
    assert res["total_available_capacity"] == 900
    # Buffered demand: 1200 * 1.15 = 1380. 1380 / 60 = 23 buses. Additional: 23 - 15 = 8 buses.
    assert res["required_buses"] == 23
    assert res["additional_buses_needed"] == 8
    assert res["overcrowding_risk"] in ["high", "critical"]
    assert "増便" in res["dispatch_recommendation_text"]

def test_ml_forecasting_prediction(db_session):
    forecast = MLEngineService.generate_forecast(
        db=db_session,
        route_id=1,
        horizon_days=7,
        model_type="gradient_boosting"
    )
    assert len(forecast["predictions"]) == 7
    for pt in forecast["predictions"]:
        assert pt["predicted"] > 0
        assert pt["upper_bound"] >= pt["predicted"]
        assert pt["lower_bound"] <= pt["predicted"]

def test_ai_insights_highest_demand(db_session):
    res = InsightsEngineService.answer_query(
        db=db_session,
        user_query="Which route has the highest passenger demand?"
    )
    assert res["category"] == "route_demand"
    assert "富士" in res["answer"]
    assert "key_metrics" in res
    assert "top_route_name" in res["key_metrics"]

def test_data_cleaning_pipeline(db_session):
    # Test CSV with missing values and duplicates
    csv_content = b"""date,route_code,hour,passenger_count
2026-03-01,ROUTE-FS5,10,120
2026-03-01,ROUTE-FS5,10,120
2026-03-01,ROUTE-FS5,11,
2026-03-01,ROUTE-KWR,12,-5
"""
    dataset_rec, report, clean_path = DataCleaningService.inspect_and_clean_file(
        file_bytes=csv_content,
        filename="test_upload.csv",
        db=db_session,
        user_id=1
    )
    assert report["total_rows"] == 4
    assert report["valid_rows"] == 3  # duplicate removed
    assert report["duplicate_rows_count"] == 1
    assert report["missing_values_count"] == 1
    assert os.path.exists(clean_path)
