from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import InsightQueryRequest, InsightQueryResponse
from app.services.insights_engine import InsightsEngineService

router = APIRouter(prefix="/insights", tags=["AI Business Insights"])

@router.post("/query", response_model=InsightQueryResponse)
def query_insights(req: InsightQueryRequest, db: Session = Depends(get_db)):
    result = InsightsEngineService.answer_query(db=db, user_query=req.query)
    return result

@router.get("/quick-prompts")
def get_quick_prompts() -> List[Dict[str, str]]:
    return [
        {
            "id": "q1",
            "title_ja": "最も乗客需要が高い路線は？",
            "title_en": "Which route has the highest passenger demand?",
            "query": "Which route has the highest passenger demand?"
        },
        {
            "id": "q2",
            "title_ja": "一週間で最も混雑する曜日は？",
            "title_en": "What are the busiest days of the week?",
            "query": "What are the busiest days?"
        },
        {
            "id": "q3",
            "title_ja": "明日の運行で追加バスは何両必要？",
            "title_en": "How many additional buses may be needed tomorrow?",
            "query": "How many additional buses may be needed tomorrow?"
        },
        {
            "id": "q4",
            "title_ja": "観光客数がピークとなる月はいつ？",
            "title_en": "Which month has the highest tourism traffic?",
            "query": "Which month has the highest tourism traffic?"
        },
        {
            "id": "q5",
            "title_ja": "降雨時の乗客需要への影響は？",
            "title_en": "What is the impact of rainfall on tourist demand?",
            "query": "What is the impact of rainfall and weather on passenger demand?"
        }
    ]
