import os
import json
import joblib
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.models.entities import (
    PassengerRecord, Route, WeatherRecord, HolidayCalendar,
    ForecastingModel, ForecastResult
)

class MLEngineService:
    FEATURE_COLS = [
        "day_of_week",
        "month",
        "is_weekend",
        "is_holiday",
        "season_id",
        "temp_celsius",
        "rainfall_mm",
        "lag_1",
        "lag_7",
        "rolling_7",
        "rolling_14"
    ]

    @staticmethod
    def _get_season_id(month: int) -> int:
        if month in [3, 4, 5]:
            return 1  # Spring (Cherry blossom, Shibazakura)
        elif month in [6, 7, 8]:
            return 2  # Summer (Mt. Fuji climbing season)
        elif month in [9, 10, 11]:
            return 3  # Autumn (Koyo foliage)
        else:
            return 4  # Winter (Snow peak views)

    @classmethod
    def prepare_dataset_for_route(
        cls, db: Session, route_id: Optional[int] = None
    ) -> pd.DataFrame:
        """
        Builds aggregated daily time series dataframe with engineered lag and rolling features.
        """
        query = db.query(
            PassengerRecord.date,
            func.sum(PassengerRecord.passenger_count).label("daily_passengers")
        )
        if route_id:
            query = query.filter(PassengerRecord.route_id == route_id)

        rows = query.group_by(PassengerRecord.date).order_by(PassengerRecord.date).all()
        if not rows or len(rows) < 20:
            return pd.DataFrame()

        df = pd.DataFrame([{"date": r.date, "daily_passengers": r.daily_passengers} for r in rows])
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

        # Weather mapping
        weather_rows = db.query(WeatherRecord).all()
        weather_map = {pd.to_datetime(w.date): (w.temp_celsius, w.rainfall_mm) for w in weather_rows}

        # Holiday mapping
        holiday_rows = db.query(HolidayCalendar).all()
        holiday_dates = set(pd.to_datetime(h.date) for h in holiday_rows)

        # Feature Engineering
        df["day_of_week"] = df["date"].dt.dayofweek
        df["month"] = df["date"].dt.month
        df["is_weekend"] = df["day_of_week"].apply(lambda d: 1 if d in [5, 6] else 0)
        df["is_holiday"] = df["date"].apply(lambda d: 1 if d in holiday_dates else 0)
        df["season_id"] = df["month"].apply(cls._get_season_id)

        # Merge weather
        temps = []
        rains = []
        for d in df["date"]:
            temp, rain = weather_map.get(d, (15.0, 0.0))
            temps.append(temp)
            rains.append(rain)
        df["temp_celsius"] = temps
        df["rainfall_mm"] = rains

        # Lags and Rolling Windows (Prevent future leakage)
        df["lag_1"] = df["daily_passengers"].shift(1)
        df["lag_7"] = df["daily_passengers"].shift(7)
        df["rolling_7"] = df["daily_passengers"].shift(1).rolling(window=7, min_periods=1).mean()
        df["rolling_14"] = df["daily_passengers"].shift(1).rolling(window=14, min_periods=1).mean()

        # Impute initial NaNs caused by shifting
        df["lag_1"] = df["lag_1"].bfill()
        df["lag_7"] = df["lag_7"].bfill()
        df["rolling_7"] = df["rolling_7"].bfill()
        df["rolling_14"] = df["rolling_14"].bfill()

        return df

    @classmethod
    def train_and_evaluate(
        cls, db: Session, route_id: Optional[int] = None, model_type: str = "gradient_boosting"
    ) -> Tuple[ForecastingModel, Dict[str, Any]]:
        """
        Trains model chronologically (80% train, 20% validation) to avoid data leakage.
        """
        df = cls.prepare_dataset_for_route(db, route_id)
        if df.empty or len(df) < 30:
            raise ValueError("Insufficient historical data for training (minimum 30 daily points required).")

        # Chronological Split
        split_idx = int(len(df) * 0.8)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]

        X_train = train_df[cls.FEATURE_COLS]
        y_train = train_df["daily_passengers"]
        X_test = test_df[cls.FEATURE_COLS]
        y_test = test_df["daily_passengers"]

        # Instantiate algorithm
        if model_type == "random_forest":
            model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
            model_name = f"Random Forest Regressor (Route {route_id or 'All'})"
        elif model_type == "ridge_baseline":
            model = Ridge(alpha=1.0)
            model_name = f"Ridge Baseline Regressor (Route {route_id or 'All'})"
        else:
            model = GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
            model_name = f"Gradient Boosting Regressor (Route {route_id or 'All'})"
            model_type = "gradient_boosting"

        model.fit(X_train, y_train)

        # Validation Predictions
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        # Save model artifact
        filename = f"{model_type}_route_{route_id or 'all'}.joblib"
        model_path = str(settings.MODELS_DIR / filename)
        joblib.dump(model, model_path)

        # Deactivate previous active models of same scope
        prev_models = db.query(ForecastingModel).filter(
            ForecastingModel.model_type == model_type,
            ForecastingModel.is_active == True
        ).all()
        for pm in prev_models:
            pm.is_active = False

        # Persist model record in DB
        db_model = ForecastingModel(
            model_name=model_name,
            model_type=model_type,
            target_variable="daily_passengers",
            training_start_date=train_df["date"].min().date(),
            training_end_date=train_df["date"].max().date(),
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            r2=round(r2, 4),
            parameters_json=json.dumps({"n_features": len(cls.FEATURE_COLS), "features": cls.FEATURE_COLS}),
            file_path=model_path,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)

        eval_summary = {
            "model_id": db_model.id,
            "model_name": model_name,
            "model_type": model_type,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "train_samples": len(train_df),
            "test_samples": len(test_df)
        }
        return db_model, eval_summary

    @classmethod
    def generate_forecast(
        cls,
        db: Session,
        route_id: Optional[int] = None,
        horizon_days: int = 7,
        model_type: str = "gradient_boosting"
    ) -> Dict[str, Any]:
        """
        Generates recursive out-of-sample forecast for 1, 7, or 30 days ahead with 95% confidence intervals.
        """
        # Ensure model exists or train one
        model_record = db.query(ForecastingModel).filter(
            ForecastingModel.model_type == model_type,
            ForecastingModel.is_active == True
        ).order_by(ForecastingModel.id.desc()).first()

        if not model_record or not os.path.exists(model_record.file_path):
            model_record, _ = cls.train_and_evaluate(db, route_id, model_type)

        model = joblib.load(model_record.file_path)

        df_hist = cls.prepare_dataset_for_route(db, route_id)
        if df_hist.empty:
            raise ValueError("No historical passenger data available to seed forecasts.")

        # Holiday set
        holiday_rows = db.query(HolidayCalendar).all()
        holiday_dates = set(pd.to_datetime(h.date) for h in holiday_rows)

        last_date = df_hist["date"].max()
        last_passengers = df_hist["daily_passengers"].iloc[-14:].tolist()

        forecast_points = []
        cur_date = last_date
        simulated_history = list(last_passengers)

        rmse = model_record.rmse
        # Dynamic error propagation for prediction intervals
        z_multiplier = 1.96

        route_obj = db.query(Route).filter(Route.id == route_id).first() if route_id else None
        route_name = route_obj.name_en if route_obj else "All Mt. Fuji Routes Aggregated"

        # Clear old forecasts for this horizon and route to avoid duplicates
        if route_id:
            db.query(ForecastResult).filter(
                ForecastResult.route_id == route_id,
                ForecastResult.horizon_days == horizon_days
            ).delete()
        db.commit()

        for step in range(1, horizon_days + 1):
            cur_date = cur_date + timedelta(days=1)
            dow = cur_date.dayofweek
            month = cur_date.month
            is_wknd = 1 if dow in [5, 6] else 0
            is_hol = 1 if cur_date in holiday_dates else 0
            season_id = cls._get_season_id(month)

            # Seasonal baseline weather estimation
            temp_est = 22.0 if season_id == 2 else (14.0 if season_id in [1, 3] else 4.0)
            rain_est = 2.0 if (is_wknd and step % 4 == 0) else 0.0

            lag_1_val = simulated_history[-1]
            lag_7_val = simulated_history[-7] if len(simulated_history) >= 7 else simulated_history[-1]
            rolling_7_val = np.mean(simulated_history[-7:])
            rolling_14_val = np.mean(simulated_history[-14:])

            feat_vector = pd.DataFrame([{
                "day_of_week": dow,
                "month": month,
                "is_weekend": is_wknd,
                "is_holiday": is_hol,
                "season_id": season_id,
                "temp_celsius": temp_est,
                "rainfall_mm": rain_est,
                "lag_1": lag_1_val,
                "lag_7": lag_7_val,
                "rolling_7": rolling_7_val,
                "rolling_14": rolling_14_val
            }])[cls.FEATURE_COLS]

            pred_val = float(model.predict(feat_vector)[0])
            pred_int = max(50, int(round(pred_val)))
            simulated_history.append(pred_int)

            # Uncertainty expands slightly with horizon length
            uncertainty_growth = 1.0 + (step / horizon_days) * 0.25
            margin = z_multiplier * rmse * uncertainty_growth
            lower_bound = max(0, int(round(pred_int - margin)))
            upper_bound = int(round(pred_int + margin))

            forecast_date_str = cur_date.strftime("%Y-%m-%d")
            forecast_points.append({
                "forecast_date": forecast_date_str,
                "predicted": pred_int,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "actual": None
            })

            if route_id:
                fc_entry = ForecastResult(
                    model_id=model_record.id,
                    route_id=route_id,
                    forecast_date=cur_date.date(),
                    horizon_days=horizon_days,
                    predicted_passengers=pred_int,
                    lower_bound=lower_bound,
                    upper_bound=upper_bound,
                    created_at=datetime.utcnow()
                )
                db.add(fc_entry)

        db.commit()

        return {
            "route_id": route_id,
            "route_name": route_name,
            "horizon_days": horizon_days,
            "model_name": model_record.model_name,
            "r2_score": model_record.r2,
            "mae": model_record.mae,
            "predictions": forecast_points
        }
