import os
import random
import math
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.entities import (
    User, UserRole, Route, Station, Bus,
    PassengerRecord, TourismRecord, WeatherRecord, HolidayCalendar
)
from app.services.ml_engine import MLEngineService
from app.services.capacity_engine import CapacityEngineService

# Fixed random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

def seed_database():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Route).count() > 0:
            print("Database already contains route records. Skipping seed.")
            return

        print("Seeding Users...")
        users = [
            User(
                email="admin@fujikyu.co.jp",
                hashed_password=get_password_hash("admin123"),
                full_name="Takahashi Hiroshi (高橋 宏)",
                role=UserRole.ADMIN.value,
                department="Digital Transformation Strategy HQ (DX戦略本部)",
                is_active=True
            ),
            User(
                email="manager@fujikyu.co.jp",
                hashed_password=get_password_hash("manager123"),
                full_name="Sato Kenichi (佐藤 健一)",
                role=UserRole.MANAGER.value,
                department="Bus Transportation Operations Division (乗合自動車運行部)",
                is_active=True
            ),
            User(
                email="analyst@fujikyu.co.jp",
                hashed_password=get_password_hash("analyst123"),
                full_name="Watanabe Aoi (渡辺 葵)",
                role=UserRole.ANALYST.value,
                department="Passenger Demand Analytics & Route Planning (需要動態分析課)",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Stations around Mt. Fuji...")
        stations = [
            Station(station_code="ST-KWG", name_ja="河口湖駅", name_en="Kawaguchiko Station", latitude=35.4982, longitude=138.7686, elevation_m=857.0, is_terminal=True),
            Station(station_code="ST-FJS", name_ja="富士山駅", name_en="Fujisan Station", latitude=35.4839, longitude=138.7958, elevation_m=809.0, is_terminal=True),
            Station(station_code="ST-FS5", name_ja="富士山五合目 (スバルライン)", name_en="Mt. Fuji 5th Station", latitude=35.3906, longitude=138.7328, elevation_m=2305.0, is_terminal=True),
            Station(station_code="ST-OSH", name_ja="忍野八海", name_en="Oshino Hakkai", latitude=35.4597, longitude=138.8328, elevation_m=935.0, is_terminal=False),
            Station(station_code="ST-OIS", name_ja="大石公園 (自然生活館)", name_en="Oishi Park", latitude=35.5228, longitude=138.7456, elevation_m=835.0, is_terminal=False),
            Station(station_code="ST-CHR", name_ja="新倉山浅間公園・忠霊塔", name_en="Chureito Pagoda", latitude=35.5019, longitude=138.8014, elevation_m=850.0, is_terminal=False),
            Station(station_code="ST-YMN", name_ja="山中湖 旭日丘", name_en="Lake Yamanakako Asahigaoka", latitude=35.4095, longitude=138.8789, elevation_m=980.0, is_terminal=False),
            Station(station_code="ST-GOT", name_ja="御殿場プレミアム・アウトレット", name_en="Gotemba Premium Outlets", latitude=35.3094, longitude=138.9642, elevation_m=430.0, is_terminal=True),
            Station(station_code="ST-SJK", name_ja="バスタ新宿 (高速バスターミナル)", name_en="Busta Shinjuku Expressway Terminal", latitude=35.6885, longitude=139.7005, elevation_m=40.0, is_terminal=True),
        ]
        db.add_all(stations)
        db.commit()

        print("Seeding Routes...")
        routes = [
            Route(route_code="ROUTE-FS5", name_ja="富士スバルライン五合目直行バス", name_en="Fuji Subaru Line 5th Station Shuttle", origin_station="河口湖駅", destination_station="富士山五合目", distance_km=30.0, standard_duration_min=50, is_active=True),
            Route(route_code="ROUTE-KWR", name_ja="河口湖周遊バス (レッドライン)", name_en="Kawaguchiko Sightseeing Red Line", origin_station="河口湖駅", destination_station="大石公園", distance_km=15.0, standard_duration_min=35, is_active=True),
            Route(route_code="ROUTE-KWG", name_ja="西湖周遊バス (グリーンライン)", name_en="Saiko Sightseeing Green Line", origin_station="河口湖駅", destination_station="西湖いやしの里根場", distance_km=24.0, standard_duration_min=45, is_active=True),
            Route(route_code="ROUTE-SNK", name_ja="富士五湖〜新宿 高速バス", name_en="Shinjuku - Mt. Fuji Highway Express", origin_station="バスタ新宿", destination_station="河口湖駅", distance_km=105.0, standard_duration_min=105, is_active=True),
            Route(route_code="ROUTE-GOT", name_ja="河口湖〜御殿場アウトレット特急バス", name_en="Kawaguchiko - Gotemba Outlets Express", origin_station="河口湖駅", destination_station="御殿場プレミアム・アウトレット", distance_km=38.0, standard_duration_min=65, is_active=True),
            Route(route_code="ROUTE-YMN", name_ja="山中湖周遊・忍野八海シャトル", name_en="Lake Yamanakako & Oshino Hakkai Shuttle", origin_station="富士山駅", destination_station="山中湖 旭日丘", distance_km=22.0, standard_duration_min=40, is_active=True),
        ]
        db.add_all(routes)
        db.commit()

        print("Seeding Bus Fleet...")
        bus_types = ["Highway Express Coach", "Sightseeing Low-Floor Bus", "Zero-Emission EV Bus", "Large Touring Coach"]
        buses = []
        for i in range(1, 26):
            bus_num = f"FK-{100 + i}"
            b_type = bus_types[(i - 1) % len(bus_types)]
            buses.append(
                Bus(
                    bus_number=bus_num,
                    license_plate=f"山梨200 か {1000 + i}",
                    capacity=60 if "Express" in b_type or "Touring" in b_type else 50,
                    bus_type=b_type,
                    model_year=2021 + (i % 4),
                    status="active" if i <= 22 else "standby"
                )
            )
        db.add_all(buses)
        db.commit()

        print("Seeding Japanese Holiday Calendar...")
        # 2026 / 2025 Calendar
        holidays_data = [
            (date(2025, 1, 1), "元日 (New Year's Day)", "National Holiday", True),
            (date(2025, 1, 13), "成人の日 (Coming of Age Day)", "National Holiday", True),
            (date(2025, 2, 11), "建国記念の日 (National Foundation Day)", "National Holiday", False),
            (date(2025, 2, 23), "天皇誕生日 (Emperor's Birthday)", "National Holiday", False),
            (date(2025, 3, 20), "春分の日 (Vernal Equinox)", "National Holiday", False),
            (date(2025, 4, 29), "昭和の日 (Showa Day - GW)", "Golden Week", True),
            (date(2025, 5, 3), "憲法記念日 (Constitution Memorial Day - GW)", "Golden Week", True),
            (date(2025, 5, 4), "みどりの日 (Greenery Day - GW)", "Golden Week", True),
            (date(2025, 5, 5), "こどもの日 (Children's Day - GW)", "Golden Week", True),
            (date(2025, 5, 6), "振替休日 (Substitute Holiday)", "Golden Week", True),
            (date(2025, 7, 21), "海の日 (Marine Day)", "National Holiday", True),
            (date(2025, 8, 11), "山の日 (Mountain Day - Mt Fuji Peak)", "National Holiday", True),
            (date(2025, 8, 13), "お盆 (Obon Festival Holiday)", "Obon", True),
            (date(2025, 8, 14), "お盆 (Obon Festival Holiday)", "Obon", True),
            (date(2025, 8, 15), "お盆 (Obon Festival Holiday)", "Obon", True),
            (date(2025, 9, 15), "敬老の日 (Respect for the Aged Day)", "National Holiday", True),
            (date(2025, 9, 23), "秋分の日 (Autumnal Equinox)", "National Holiday", False),
            (date(2025, 10, 13), "スポーツの日 (Sports Day)", "National Holiday", True),
            (date(2025, 11, 3), "文化の日 (Culture Day)", "National Holiday", True),
            (date(2025, 11, 23), "勤労感謝の日 (Labor Thanksgiving Day)", "National Holiday", False),
            (date(2025, 12, 31), "大晦日 (New Year's Eve)", "National Holiday", True),
            # 2026 early
            (date(2026, 1, 1), "元日 (New Year's Day)", "National Holiday", True),
            (date(2026, 1, 12), "成人の日 (Coming of Age Day)", "National Holiday", True),
            (date(2026, 2, 11), "建国記念の日 (National Foundation Day)", "National Holiday", False),
            (date(2026, 2, 23), "天皇誕生日 (Emperor's Birthday)", "National Holiday", True),
            (date(2026, 3, 20), "春分の日 (Vernal Equinox)", "National Holiday", False),
            (date(2026, 4, 29), "昭和の日 (Showa Day)", "Golden Week", True),
            (date(2026, 5, 3), "憲法記念日 (Constitution Memorial Day)", "Golden Week", True),
            (date(2026, 5, 4), "みどりの日 (Greenery Day)", "Golden Week", True),
            (date(2026, 5, 5), "こどもの日 (Children's Day)", "Golden Week", True),
            (date(2026, 7, 20), "海の日 (Marine Day)", "National Holiday", True),
            (date(2026, 8, 11), "山の日 (Mountain Day - Mt Fuji Climbing)", "National Holiday", True),
            (date(2026, 9, 21), "敬老の日 (Respect for Aged)", "National Holiday", True),
            (date(2026, 9, 22), "国民の休日 (Citizen's Holiday)", "National Holiday", True),
            (date(2026, 9, 23), "秋分の日 (Autumnal Equinox)", "National Holiday", True),
            (date(2026, 10, 12), "スポーツの日 (Sports Day)", "National Holiday", True),
            (date(2026, 11, 3), "文化の日 (Culture Day - Koyo Peak)", "National Holiday", True),
        ]
        holidays = [
            HolidayCalendar(date=d, holiday_name=name, holiday_type=ht, is_long_weekend=lw)
            for d, name, ht, lw in holidays_data
        ]
        db.add_all(holidays)
        db.commit()

        holiday_set = set(h.date for h in holidays)

        print("Generating 14 months of historical Passenger & Weather records (Mt. Fuji Area)...")
        # Start date: 2025-01-01 to 2026-03-01 (over 420 days)
        start_date = date(2025, 1, 1)
        end_date = date(2026, 3, 1)
        total_days = (end_date - start_date).days

        weather_records = []
        passenger_records = []
        tourism_records = []

        # Route baseline daily volumes
        route_base_pax = {
            1: 850,   # 5th Station (heavily seasonal)
            2: 1250,  # Kawaguchiko Red Line (high year-round, huge in Autumn)
            3: 620,   # Saiko Green Line
            4: 1600,  # Shinjuku Highway Express (massive commuter/weekend traffic)
            5: 900,   # Gotemba Outlets
            6: 780    # Yamanakako & Oshino Hakkai
        }

        active_routes = db.query(Route).all()

        for d_idx in range(total_days):
            cur_date = start_date + timedelta(days=d_idx)
            month = cur_date.month
            dow = cur_date.weekday()
            is_weekend = dow in [5, 6]
            is_holiday = cur_date in holiday_set

            # Realistic weather generation for Kawaguchiko (elev 857m)
            # Temp curve: min -3°C in Jan/Feb, max 28°C in July/Aug
            mean_temp = 13.0 + 13.0 * math.sin((month - 4) * (2 * math.pi / 12)) + random.uniform(-2.5, 2.5)
            # Rain probability
            rain_prob = 0.28 if month in [6, 7, 9] else 0.18
            is_raining = random.random() < rain_prob
            rain_mm = round(float(np.random.exponential(scale=12.0)), 1) if is_raining else 0.0
            is_snowing = (mean_temp <= 1.5) and is_raining
            snow_cm = round(rain_mm * 0.8, 1) if is_snowing else 0.0

            if is_snowing:
                cond = "Snow"
            elif is_raining:
                cond = "Rain" if rain_mm < 25 else "Heavy Rain"
            elif random.random() < 0.35:
                cond = "Cloudy"
            else:
                cond = "Clear"

            w_rec = WeatherRecord(
                date=cur_date,
                location="Fujikawaguchiko",
                condition=cond,
                temp_celsius=round(mean_temp, 1),
                rainfall_mm=rain_mm if not is_snowing else 0.0,
                snowfall_cm=snow_cm,
                wind_speed_kmh=round(random.uniform(5.0, 22.0), 1),
                visibility_km=round(random.uniform(5.0, 25.0) if not is_raining else random.uniform(2.0, 8.0), 1),
                created_at=datetime.utcnow()
            )
            weather_records.append(w_rec)

            # Tourism record
            f_mult = 1.6 if month in [4, 7, 8, 10] else (1.1 if is_weekend else 0.85)
            foreign_pax = int(random.uniform(2500, 6000) * f_mult)
            domestic_pax = int(random.uniform(4000, 11000) * (1.8 if is_weekend or is_holiday else 1.0))
            hotel_occ = min(98.5, max(35.0, 55.0 + 35.0 * (1.0 if is_weekend or is_holiday else 0.0) + (10.0 if month in [7, 8, 10] else 0.0) + random.uniform(-5, 5)))

            event_name = None
            if month == 4 and 15 <= cur_date.day <= 30:
                event_name = "富士芝桜まつり (Fuji Shibazakura Festival)"
            elif month == 7 and cur_date.day == 1:
                event_name = "富士山開山祭 (Mt. Fuji Climbing Opening Ceremony)"
            elif month == 8 and cur_date.day == 26:
                event_name = "吉田の火祭り (Yoshida Fire Festival)"
            elif month == 11 and 1 <= cur_date.day <= 20:
                event_name = "富士河口湖紅葉まつり (Kawaguchiko Autumn Leaves Festival)"

            tourism_records.append(TourismRecord(
                date=cur_date,
                region="Mt. Fuji / Fuji Five Lakes",
                foreign_visitor_estimate=foreign_pax,
                domestic_visitor_estimate=domestic_pax,
                hotel_occupancy_rate=round(hotel_occ, 1),
                event_name=event_name,
                created_at=datetime.utcnow()
            ))

            # Seasonal Multipliers
            # Spring (April cherry blossoms / Shibazakura): +30%
            # Summer (July-August climbing peak): +60% for 5th Station, +35% overall
            # Autumn (October-November Koyo leaves): +45% for Kawaguchiko line
            # Winter (Jan-Feb): -20% overall, but clear Fuji views
            season_mult = 1.0
            if month in [4, 5]:
                season_mult = 1.35
            elif month in [7, 8]:
                season_mult = 1.55
            elif month in [10, 11]:
                season_mult = 1.40
            elif month in [1, 2]:
                season_mult = 0.82

            weekend_mult = 1.45 if is_weekend else 1.0
            holiday_mult = 1.60 if is_holiday else 1.0

            # Rain suppression factor (people cancel outdoor trips)
            rain_suppression = 0.68 if (is_raining and rain_mm > 5.0) else 1.0

            # Key hours of operation (07:00 to 20:00)
            operating_hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
            # Hourly weights (peaks at 9-11 and 16-18)
            hour_weights = {
                7: 0.4, 8: 0.8, 9: 1.4, 10: 1.6, 11: 1.3,
                12: 1.1, 13: 1.0, 14: 1.2, 15: 1.4, 16: 1.7,
                17: 1.5, 18: 1.1, 19: 0.7, 20: 0.4
            }

            for r in active_routes:
                base = route_base_pax.get(r.id, 800)
                
                # Special boost for 5th Station in July/Aug (official climbing season)
                r_season_mult = season_mult
                if r.id == 1:  # 5th Station
                    if month in [7, 8]:
                        r_season_mult = 2.4
                    elif month in [12, 1, 2]:
                        r_season_mult = 0.25  # Snow closure limits traffic

                daily_total_pax = int(
                    base * r_season_mult * weekend_mult * holiday_mult * rain_suppression * random.uniform(0.92, 1.08)
                )

                for h in operating_hours:
                    w = hour_weights[h]
                    h_pax = max(5, int((daily_total_pax / len(operating_hours)) * w * random.uniform(0.9, 1.1)))
                    boardings = int(h_pax * random.uniform(0.55, 0.75))
                    alightings = max(0, h_pax - boardings)

                    passenger_records.append(PassengerRecord(
                        date=cur_date,
                        route_id=r.id,
                        station_id=None,
                        hour=h,
                        passenger_count=h_pax,
                        boardings=boardings,
                        alightings=alightings,
                        is_synthetic=True,
                        created_at=datetime.utcnow()
                    ))

        print(f"Bulk saving {len(weather_records)} weather, {len(tourism_records)} tourism, and {len(passenger_records)} passenger records...")
        db.bulk_save_objects(weather_records)
        db.bulk_save_objects(tourism_records)
        db.bulk_save_objects(passenger_records)
        db.commit()

        print("Training initial AI Forecasting Models...")
        for m_type in ["gradient_boosting", "random_forest", "ridge_baseline"]:
            try:
                db_model, summary = MLEngineService.train_and_evaluate(db=db, route_id=None, model_type=m_type)
                print(f"  Trained {m_type}: MAE={summary['mae']}, RMSE={summary['rmse']}, R2={summary['r2']}")
            except Exception as e:
                print(f"  Warning training {m_type}: {e}")

        print("Seeding sample capacity recommendations...")
        # Add sample recommendation for tomorrow
        CapacityEngineService.calculate_recommendation(
            db=db,
            route_id=1,
            predicted_passengers=1280,
            available_buses=15,
            bus_capacity=60,
            safety_margin_pct=15.0,
            eval_date=date.today() + timedelta(days=1)
        )
        CapacityEngineService.calculate_recommendation(
            db=db,
            route_id=2,
            predicted_passengers=1750,
            available_buses=20,
            bus_capacity=60,
            safety_margin_pct=15.0,
            eval_date=date.today() + timedelta(days=1)
        )

        print("Creating sample test CSV & Excel files for Data Upload Module...")
        create_sample_upload_files()

        print("Seed data generation completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

def create_sample_upload_files():
    """Creates ready-to-test CSV and Excel datasets with minor realistic quirks."""
    sample_dates = [
        (date.today() - timedelta(days=i)).strftime("%Y-%m-%d")
        for i in range(1, 15)
    ]
    routes = ["ROUTE-FS5", "ROUTE-KWR", "ROUTE-SNK", "ROUTE-GOT"]
    rows = []
    for d in sample_dates:
        for r in routes:
            for h in [9, 10, 14, 16]:
                pax = int(random.uniform(40, 180))
                rows.append({
                    "date": d,
                    "route_code": r,
                    "hour": h,
                    "passenger_count": pax,
                    "boardings": int(pax * 0.65),
                    "alightings": int(pax * 0.35)
                })

    df = pd.DataFrame(rows)

    # Intentionally add 2 missing passenger values and 1 duplicate to showcase ETL pipeline robustness
    df.loc[2, "passenger_count"] = np.nan
    df.loc[7, "passenger_count"] = np.nan
    dup_row = df.iloc[5:6].copy()
    df = pd.concat([df, dup_row], ignore_index=True)

    csv_path = settings.SAMPLES_DIR / "sample_fuji_passenger_upload.csv"
    xlsx_path = settings.SAMPLES_DIR / "sample_fuji_passenger_upload.xlsx"

    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False)
    print(f"  Generated sample CSV: {csv_path}")
    print(f"  Generated sample Excel: {xlsx_path}")

if __name__ == "__main__":
    seed_database()
