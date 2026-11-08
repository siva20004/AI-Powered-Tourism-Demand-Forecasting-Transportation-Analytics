import math
from datetime import date, datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.entities import CapacityRecommendation, Route, RiskLevel, ManagerStatus

class CapacityEngineService:
    @staticmethod
    def calculate_recommendation(
        db: Session,
        route_id: int,
        predicted_passengers: int,
        available_buses: int = 15,
        bus_capacity: int = 60,
        safety_margin_pct: float = 15.0,
        eval_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calculates required buses, capacity shortfall, utilization percentage,
        and human-in-the-loop managerial guidance.
        """
        if available_buses <= 0:
            available_buses = 1
        if bus_capacity <= 0:
            bus_capacity = 60

        route = db.query(Route).filter(Route.id == route_id).first()
        route_name = f"{route.name_ja} ({route.name_en})" if route else f"Route #{route_id}"

        total_available_capacity = available_buses * bus_capacity
        buffered_demand = predicted_passengers * (1.0 + (safety_margin_pct / 100.0))
        required_buses = math.ceil(buffered_demand / bus_capacity)
        additional_buses_needed = max(0, required_buses - available_buses)

        utilization_pct = round((predicted_passengers / total_available_capacity) * 100.0, 1) if total_available_capacity > 0 else 100.0

        if utilization_pct <= 75.0:
            risk = RiskLevel.NORMAL.value
            risk_label_ja = "通常稼働 (安定)"
        elif utilization_pct <= 92.0:
            risk = RiskLevel.MODERATE.value
            risk_label_ja = "中程度混雑 (注意)"
        elif utilization_pct <= 110.0:
            risk = RiskLevel.HIGH.value
            risk_label_ja = "高需要混雑 (配車検討)"
        else:
            risk = RiskLevel.CRITICAL.value
            risk_label_ja = "満員超過警報 (増便必須)"

        if additional_buses_needed > 0:
            recommendation_text = (
                f"【増便推奨】予想乗客数 {predicted_passengers:,} 名に対し、現在配車枠 {available_buses} 両 (定員 {total_available_capacity:,} 名) では "
                f"{predicted_passengers - total_available_capacity:,} 名の定員不足が見込まれます。"
                f"安全予備率 {safety_margin_pct:.0f}% を加味し、追加で【{additional_buses_needed} 両】の臨時便または待機バスの配車を推奨します。"
            )
        else:
            surplus_seats = total_available_capacity - predicted_passengers
            recommendation_text = (
                f"【適正運用】予想乗客数 {predicted_passengers:,} 名に対し、配車枠 {available_buses} 両 (定員 {total_available_capacity:,} 名) で "
                f"稼働率 {utilization_pct}% と健全な運用が可能です（余剰席 {surplus_seats:,} 席）。追加配車は不要です。"
            )

        managerial_guidance = (
            "※ 本推奨値はAI需要予測と安全予備率に基づく意思決定支援データです。"
            "道路交通規制、乗務員勤務シフト、および天候警報を確認のうえ、運行管理者の最終承認を行ってください。"
        )

        sim_date = eval_date or date.today()

        # Persist recommendation
        rec_entry = CapacityRecommendation(
            date=sim_date,
            route_id=route_id,
            predicted_demand=predicted_passengers,
            available_buses=available_buses,
            required_buses=required_buses,
            bus_capacity=bus_capacity,
            safety_margin_pct=safety_margin_pct,
            overcrowding_risk=risk,
            manager_status=ManagerStatus.PENDING.value,
            manager_note=None,
            created_at=datetime.utcnow()
        )
        db.add(rec_entry)
        db.commit()
        db.refresh(rec_entry)

        return {
            "recommendation_id": rec_entry.id,
            "route_id": route_id,
            "route_name": route_name,
            "date": sim_date.strftime("%Y-%m-%d"),
            "predicted_passengers": predicted_passengers,
            "available_buses": available_buses,
            "bus_capacity": bus_capacity,
            "safety_margin_pct": safety_margin_pct,
            "total_available_capacity": total_available_capacity,
            "required_buses": required_buses,
            "additional_buses_needed": additional_buses_needed,
            "capacity_utilization_pct": utilization_pct,
            "overcrowding_risk": risk,
            "risk_label_ja": risk_label_ja,
            "dispatch_recommendation_text": recommendation_text,
            "managerial_guidance": managerial_guidance
        }
