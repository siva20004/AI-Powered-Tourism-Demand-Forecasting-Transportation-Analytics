import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"

class RiskLevel(str, enum.Enum):
    NORMAL = "normal"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class ManagerStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REVISED = "revised"
    REJECTED = "rejected"

# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.ANALYST.value, nullable=False)
    department = Column(String(100), default="Transportation Operations")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    uploads = relationship("UploadedDataset", back_populates="uploader")
    reports = relationship("GeneratedReport", back_populates="generator")
    audit_logs = relationship("AuditLog", back_populates="user")

# 2. Routes
class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(50), unique=True, index=True, nullable=False)
    name_ja = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    origin_station = Column(String(100), nullable=False)
    destination_station = Column(String(100), nullable=False)
    distance_km = Column(Float, nullable=False)
    standard_duration_min = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    passenger_records = relationship("PassengerRecord", back_populates="route")
    forecasts = relationship("ForecastResult", back_populates="route")
    recommendations = relationship("CapacityRecommendation", back_populates="route")

# 3. Stations
class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(50), unique=True, index=True, nullable=False)
    name_ja = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    is_terminal = Column(Boolean, default=False)

    passenger_records = relationship("PassengerRecord", back_populates="station")

# 4. Buses
class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, index=True, nullable=False)
    license_plate = Column(String(50), nullable=False)
    capacity = Column(Integer, default=60, nullable=False)
    bus_type = Column(String(100), default="Highway Express Coach")  # e.g., EV Bus, Sightseeing Coach
    model_year = Column(Integer, default=2023)
    status = Column(String(50), default="active")  # active, maintenance, standby
    last_maintenance_date = Column(Date, nullable=True)

# 5. Passenger Records
class PassengerRecord(Base):
    __tablename__ = "passenger_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True, index=True)
    hour = Column(Integer, nullable=False)  # 0 to 23
    passenger_count = Column(Integer, nullable=False)
    boardings = Column(Integer, default=0)
    alightings = Column(Integer, default=0)
    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    route = relationship("Route", back_populates="passenger_records")
    station = relationship("Station", back_populates="passenger_records")

    __table_args__ = (
        Index("idx_passenger_date_route", "date", "route_id"),
        Index("idx_passenger_date_hour", "date", "hour"),
    )

# 6. Tourism Records
class TourismRecord(Base):
    __tablename__ = "tourism_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    region = Column(String(100), default="Mt. Fuji / Fuji Five Lakes", nullable=False)
    foreign_visitor_estimate = Column(Integer, default=0)
    domestic_visitor_estimate = Column(Integer, default=0)
    hotel_occupancy_rate = Column(Float, default=0.0)  # 0.0 - 100.0%
    event_name = Column(String(255), nullable=True)  # e.g., Fuji Shibazakura Festival, Autumn Leaves Fest
    created_at = Column(DateTime, default=datetime.utcnow)

# 7. Weather Records
class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    location = Column(String(100), default="Fujikawaguchiko", nullable=False)
    condition = Column(String(50), default="Clear")  # Clear, Rain, Snow, Cloudy, Typhoon
    temp_celsius = Column(Float, default=15.0)
    rainfall_mm = Column(Float, default=0.0)
    snowfall_cm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=10.0)
    visibility_km = Column(Float, default=15.0)
    created_at = Column(DateTime, default=datetime.utcnow)

# 8. Holiday Calendar
class HolidayCalendar(Base):
    __tablename__ = "holiday_calendar"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    holiday_name = Column(String(100), nullable=False)
    holiday_type = Column(String(50), default="National Holiday")  # National, Golden Week, Obon, New Year
    is_long_weekend = Column(Boolean, default=False)

# 9. Uploaded Datasets
class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_format = Column(String(20), nullable=False)  # csv, xlsx, xls
    row_count = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    status = Column(String(50), default="processing")  # processing, completed, failed
    cleaned_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User", back_populates="uploads")
    quality_logs = relationship("DataQualityLog", back_populates="dataset", cascade="all, delete-orphan")

# 10. Data Quality Logs
class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id"), nullable=False, index=True)
    check_type = Column(String(100), nullable=False)  # missing_values, duplicate_keys, schema_mismatch, outliers
    severity = Column(String(20), default="warning")  # info, warning, error
    issue_count = Column(Integer, default=0)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("UploadedDataset", back_populates="quality_logs")

# 11. Forecasting Models
class ForecastingModel(Base):
    __tablename__ = "forecasting_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # gradient_boosting, random_forest, ridge_baseline
    target_variable = Column(String(50), default="passenger_count")
    training_start_date = Column(Date, nullable=False)
    training_end_date = Column(Date, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    parameters_json = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    forecast_results = relationship("ForecastResult", back_populates="model")

# 12. Forecast Results
class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("forecasting_models.id"), nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False, index=True)
    forecast_date = Column(Date, nullable=False, index=True)
    horizon_days = Column(Integer, nullable=False)  # 1, 7, 30
    predicted_passengers = Column(Integer, nullable=False)
    lower_bound = Column(Integer, nullable=False)
    upper_bound = Column(Integer, nullable=False)
    actual_passengers = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("ForecastingModel", back_populates="forecast_results")
    route = relationship("Route", back_populates="forecasts")

    __table_args__ = (
        Index("idx_forecast_date_route", "forecast_date", "route_id"),
    )

# 13. Capacity Recommendations
class CapacityRecommendation(Base):
    __tablename__ = "capacity_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False, index=True)
    predicted_demand = Column(Integer, nullable=False)
    available_buses = Column(Integer, nullable=False)
    required_buses = Column(Integer, nullable=False)
    bus_capacity = Column(Integer, default=60, nullable=False)
    safety_margin_pct = Column(Float, default=15.0)
    overcrowding_risk = Column(String(50), default=RiskLevel.NORMAL.value)
    manager_status = Column(String(50), default=ManagerStatus.PENDING.value)
    manager_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    route = relationship("Route", back_populates="recommendations")

# 14. Generated Reports
class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    report_type = Column(String(50), nullable=False)  # daily, weekly, monthly, forecast, route, capacity
    title = Column(String(255), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    format = Column(String(20), nullable=False)  # pdf, xlsx, csv
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    generator = relationship("User", back_populates="reports")

# 15. Audit Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, UPLOAD, RETRAIN, EXPORT, CAPACITY_REVISE
    resource = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
