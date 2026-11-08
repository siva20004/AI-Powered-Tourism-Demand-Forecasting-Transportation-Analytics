from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ----------------- Auth & Users -----------------
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "analyst"
    department: Optional[str] = "Transportation Operations"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

# ----------------- Route & Fleet -----------------
class RouteResponse(BaseModel):
    id: int
    route_code: str
    name_ja: str
    name_en: str
    origin_station: str
    destination_station: str
    distance_km: float
    standard_duration_min: int
    is_active: bool

    class Config:
        from_attributes = True

class StationResponse(BaseModel):
    id: int
    station_code: str
    name_ja: str
    name_en: str
    latitude: float
    longitude: float
    elevation_m: float
    is_terminal: bool

    class Config:
        from_attributes = True

class BusResponse(BaseModel):
    id: int
    bus_number: str
    license_plate: str
    capacity: int
    bus_type: str
    model_year: int
    status: str

    model_config = {"protected_namespaces": (), "from_attributes": True}

# ----------------- Dashboard & Analytics -----------------
class DashboardSummary(BaseModel):
    total_passengers_today: int
    predicted_passengers_tomorrow: int
    monthly_passenger_volume: int
    avg_daily_passengers: int
    peak_passenger_hours: str
    bus_utilization_pct: float
    demand_growth_pct: float
    forecast_accuracy_r2: float
    forecast_mae: float
    high_demand_routes: List[Dict[str, Any]]
    low_demand_routes: List[Dict[str, Any]]

class TrendPoint(BaseModel):
    date: str
    actual: Optional[int] = None
    predicted: Optional[int] = None
    route_name: Optional[str] = None

class RouteShare(BaseModel):
    route_id: int
    route_code: str
    name_en: str
    name_ja: str
    passenger_count: int
    share_pct: float
    avg_daily: float
    status: str

class PeakHourStat(BaseModel):
    hour: int
    hour_label: str
    passenger_count: int
    avg_boardings: float

# ----------------- Data Upload & Quality -----------------
class QualityIssue(BaseModel):
    check_type: str
    severity: str
    count: int
    details: str

class QualityReport(BaseModel):
    dataset_id: int
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    missing_values_count: int
    duplicate_rows_count: int
    data_quality_score_pct: float
    processing_status: str
    issues: List[QualityIssue]
    download_url: Optional[str] = None

class DatasetResponse(BaseModel):
    id: int
    filename: str
    file_format: str
    row_count: int
    valid_rows: int
    invalid_rows: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- AI Forecasting -----------------
class ModelMetric(BaseModel):
    id: int
    model_name: str
    model_type: str
    mae: float
    rmse: float
    r2: float
    is_active: bool
    training_end_date: date
    parameters: Optional[Dict[str, Any]] = None

    model_config = {"protected_namespaces": (), "from_attributes": True}

class ForecastPoint(BaseModel):
    forecast_date: str
    predicted: int
    lower_bound: int
    upper_bound: int
    actual: Optional[int] = None

class ForecastResponse(BaseModel):
    route_id: Optional[int] = None
    route_name: str
    horizon_days: int
    model_name: str
    r2_score: float
    mae: float
    predictions: List[ForecastPoint]

    model_config = {"protected_namespaces": (), "from_attributes": True}

class RetrainRequest(BaseModel):
    model_type: str = "gradient_boosting"  # gradient_boosting, random_forest, ridge_baseline

    model_config = {"protected_namespaces": ()}

# ----------------- Weather & Seasonal -----------------
class WeatherImpactPoint(BaseModel):
    date: str
    condition: str
    temp_celsius: float
    rainfall_mm: float
    passengers: int
    is_weekend: bool
    is_holiday: bool

class SeasonalSummary(BaseModel):
    weekday_avg: float
    weekend_avg: float
    holiday_avg: float
    rain_impact_pct: float
    peak_season: str
    season_distribution: Dict[str, int]

# ----------------- Bus Capacity Simulator -----------------
class CapacitySimulateRequest(BaseModel):
    route_id: int
    predicted_passengers: Optional[int] = None
    available_buses: int = 15
    bus_capacity: int = 60
    safety_margin_pct: float = 15.0

class CapacitySimulateResponse(BaseModel):
    route_id: int
    route_name: str
    date: str
    predicted_passengers: int
    available_buses: int
    bus_capacity: int
    safety_margin_pct: float
    total_available_capacity: int
    required_buses: int
    additional_buses_needed: int
    capacity_utilization_pct: float
    overcrowding_risk: str  # normal, moderate, high, critical
    dispatch_recommendation_text: str
    managerial_guidance: str

class ManagerStatusUpdate(BaseModel):
    recommendation_id: int
    status: str  # approved, revised, rejected
    manager_note: Optional[str] = None

# ----------------- AI Business Insights -----------------
class InsightQueryRequest(BaseModel):
    query: str

class InsightQueryResponse(BaseModel):
    query: str
    category: str
    answer: str
    key_metrics: Dict[str, Any]
    recommendation: str
    supporting_data: Optional[List[Dict[str, Any]]] = None

# ----------------- Reports -----------------
class ReportGenerateRequest(BaseModel):
    report_type: str  # daily, weekly, monthly, forecast, route, capacity
    format: str = "pdf"  # pdf, xlsx, csv
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    route_id: Optional[int] = None

class ReportResponse(BaseModel):
    id: int
    report_type: str
    title: str
    period_start: date
    period_end: date
    format: str
    file_size_kb: float
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Audit Log -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_email: Optional[str] = None
    action: str
    resource: str
    details: Optional[str] = None
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True
