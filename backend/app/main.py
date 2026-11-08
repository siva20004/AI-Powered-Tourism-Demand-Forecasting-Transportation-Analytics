import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timezone
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, get_db
import app.models  # Ensures all 15 ORM models are registered
from app.routers import (
    auth, dashboard, upload, analytics,
    forecasting, weather, capacity, routes_perf,
    insights, reports
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FUJITRACK AI: Intelligent Tourism Demand Forecasting & Transportation Analytics Platform "
                "designed for Fuji Kyuko Co., Ltd. Mt. Fuji Transportation Digital Transformation (DX)."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/api/health", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "environment": settings.ENVIRONMENT
    }

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(upload.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(forecasting.router, prefix=settings.API_V1_PREFIX)
app.include_router(weather.router, prefix=settings.API_V1_PREFIX)
app.include_router(capacity.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_perf.router, prefix=settings.API_V1_PREFIX)
app.include_router(insights.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)

@app.on_event("startup")
def startup_event():
    """Auto-seed initial database if tables are empty."""
    try:
        from app.core.database import SessionLocal
        from app.models.entities import Route
        db = SessionLocal()
        route_count = db.query(Route).count()
        db.close()
        if route_count == 0:
            print("Database empty. Auto-seeding initial Mt. Fuji dataset...")
            from seeds.seed_fuji_data import seed_database
            seed_database()
            print("Auto-seed complete.")
    except Exception as e:
        print(f"Startup auto-seed notice: {e}")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# Static Files serving for Production build if frontend/dist exists
dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    assets_path = dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through if not matched
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = dist_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(dist_path / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to FUJITRACK AI Platform API (Fuji Kyuko Co., Ltd. DX)",
            "docs_url": "/docs",
            "health_check": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
