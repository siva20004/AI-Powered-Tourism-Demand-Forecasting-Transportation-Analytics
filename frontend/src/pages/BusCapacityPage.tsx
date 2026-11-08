import React, { useEffect, useState } from 'react';
import {
  Bus, Gauge, ShieldAlert, CheckCircle2,
  AlertTriangle, RefreshCw, UserCheck, Sliders, ChevronRight
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Route, CapacitySimulateResponse } from '../types';

interface BusCapacityPageProps {
  currentRole: string;
}

export const BusCapacityPage: React.FC<BusCapacityPageProps> = ({ currentRole }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [demand, setDemand] = useState<number>(1200);
  const [availableBuses, setAvailableBuses] = useState<number>(15);
  const [busCapacity, setBusCapacity] = useState<number>(60);
  const [safetyMargin, setSafetyMargin] = useState<number>(15);
  const [simResult, setSimResult] = useState<CapacitySimulateResponse | null>(null);
  const [pastRecs, setPastRecs] = useState<any[]>([]);
  const [managerNote, setManagerNote] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getRoutes().then((data) => {
      setRoutes(data);
      if (data.length > 0) setSelectedRouteId(data[0].id);
    });
    fetchPastRecs();
  }, []);

  const fetchPastRecs = async () => {
    try {
      const data = await apiClient.getCapacityRecommendations();
      setPastRecs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulate = async () => {
    try {
      const res = await apiClient.simulateCapacity({
        route_id: selectedRouteId,
        predicted_passengers: demand,
        available_buses: availableBuses,
        bus_capacity: busCapacity,
        safety_margin_pct: safetyMargin
      });
      setSimResult(res);
      fetchPastRecs();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [selectedRouteId, demand, availableBuses, busCapacity, safetyMargin]);

  const handleStatusUpdate = async (status: string) => {
    if (!simResult?.recommendation_id) return;
    try {
      await apiClient.updateCapacityStatus(
        simResult.recommendation_id,
        status,
        managerNote || `${status.toUpperCase()} by ${currentRole.toUpperCase()}`
      );
      setActionMsg(`配車計画 #${simResult.recommendation_id} を【${status.toUpperCase()}】として承認記録しました。`);
      setManagerNote('');
      fetchPastRecs();
    } catch (e: any) {
      alert('ステータス更新エラー: ' + e.message);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 font-bold text-xs">満員超過警報 (Critical Overcrowding)</span>;
      case 'high':
        return <span className="rounded-full bg-orange-100 text-orange-800 border border-orange-300 px-3 py-1 font-bold text-xs">混雑警戒・増便推奨 (High Congestion)</span>;
      case 'moderate':
        return <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 font-bold text-xs">中程度混雑 (Moderate Load)</span>;
      default:
        return <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 font-bold text-xs">通常安定稼働 (Normal Capacity)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                MODULE 6 (CORE): バス配車適正化エンジン
              </span>
              <span className="text-xs text-slate-500">Smart Fleet Capacity Recommendation Engine</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              AI需要連動型 バス最適配車 & 安全予備率シミュレータ
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              AI需要予測、現在配車車両数、バス定員（60名基準）、および運行安全予備率（15%）に基づき、
              過密混雑リスクと必要追加バス両数（続行便）を即時算出し、運行管理者の意思決定を支援します。
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start space-x-2 max-w-sm">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>安全運行遵守:</strong> 自動配車は行われません。算出結果を運行管理者が確認し承認登録を行います。
            </span>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Simulator Inputs & Real-Time Output Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Sliders & Parameter Controls */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>配車シミュレーション条件設定</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">What-If Inputs</span>
          </div>

          {/* Route Select */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">対象路線</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_code}: {r.name_ja} ({r.name_en})
                </option>
              ))}
            </select>
          </div>

          {/* Predicted Demand Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>想定旅客需要 (Predicted Passengers)</span>
              <span className="font-mono text-blue-700 text-sm">{demand.toLocaleString()} 名</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="50"
              value={demand}
              onChange={(e) => setDemand(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>200 名</span>
              <span>1,500 名</span>
              <span>3,000 名</span>
            </div>
          </div>

          {/* Available Buses */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>現在配車可能バス数 (Available Fleet)</span>
              <span className="font-mono text-blue-700 text-sm">{availableBuses} 両</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              step="1"
              value={availableBuses}
              onChange={(e) => setAvailableBuses(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>2 両</span>
              <span>15 両</span>
              <span>35 両</span>
            </div>
          </div>

          {/* Bus Capacity */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>1両あたり定員 (Capacity Per Bus)</span>
              <span className="font-mono text-slate-800 text-sm">{busCapacity} 席</span>
            </div>
            <input
              type="range"
              min="40"
              max="70"
              step="5"
              value={busCapacity}
              onChange={(e) => setBusCapacity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>40 席 (中型)</span>
              <span>60 席 (大型ハイデッカー)</span>
              <span>70 席</span>
            </div>
          </div>

          {/* Safety Buffer Margin % */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>安全予備率 (Operational Safety Buffer)</span>
              <span className="font-mono text-emerald-700 text-sm">{safetyMargin}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={safetyMargin}
              onChange={(e) => setSafetyMargin(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5% (最小)</span>
              <span>15% (富士急行標準)</span>
              <span>30% (特別警戒)</span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Recommendation Output Card */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-500">OPTIMIZED DISPATCH RECOMMENDATION</span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{simResult?.route_name}</h3>
              </div>
              {simResult && getRiskBadge(simResult.overcrowding_risk)}
            </div>

            {/* Calculations 4-box Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
                <p className="text-[11px] font-medium text-slate-500">現在座席定員枠</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">
                  {simResult?.total_available_capacity.toLocaleString()} 席
                </p>
                <p className="text-[10px] text-slate-400">{availableBuses} 両 × {busCapacity} 名</p>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3.5 text-center">
                <p className="text-[11px] font-medium text-blue-700">必要バス両数</p>
                <p className="text-lg font-extrabold text-blue-900 mt-1">
                  {simResult?.required_buses} 両
                </p>
                <p className="text-[10px] text-blue-600">予備率 {safetyMargin}% 算入</p>
              </div>

              <div className={`rounded-xl p-3.5 text-center border ${
                simResult && simResult.additional_buses_needed > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <p className="text-[11px] font-medium">追加要請バス数</p>
                <p className="text-xl font-extrabold mt-1">
                  {simResult && simResult.additional_buses_needed > 0 ? `+${simResult.additional_buses_needed} 両` : '0 両 (過不足無)'}
                </p>
                <p className="text-[10px]">待機枠からの出庫</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
                <p className="text-[11px] font-medium text-slate-500">定員稼働率</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">
                  {simResult?.capacity_utilization_pct}%
                </p>
                <p className="text-[10px] text-slate-400">適正範囲: 60〜85%</p>
              </div>
            </div>

            {/* Recommendation Narrative Box */}
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-950">
              <p className="font-bold mb-1">【AI配車推奨コメント】</p>
              <p className="leading-relaxed font-medium">{simResult?.dispatch_recommendation_text}</p>
            </div>

            <p className="mt-2 text-[11px] text-slate-400 italic">
              {simResult?.managerial_guidance}
            </p>
          </div>

          {/* Managerial Review & Sign-Off Workflow */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              運行管理者 承認ワークフロー (Manager Sign-Off Compliance)
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="運行管理メモ（例: 第2営業所より大型ハイデッカー2両を続行便として手配済）"
                value={managerNote}
                onChange={(e) => setManagerNote(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                >
                  承認 (Approve)
                </button>
                <button
                  onClick={() => handleStatusUpdate('revised')}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-500 transition-colors"
                >
                  修正 (Revise)
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="rounded-xl bg-slate-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-500 transition-colors"
                >
                  保留
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Recommendations Audit Log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">過去配車推奨・承認履歴一覧 (Historical Sign-off Trail)</h3>
            <p className="text-xs text-slate-400">直近の配車判断と管理者メモの記録</p>
          </div>
          <button onClick={fetchPastRecs} className="text-xs text-blue-600 font-semibold hover:underline">
            履歴更新
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">日付</th>
                <th className="px-3 py-2.5">路線</th>
                <th className="px-3 py-2.5">想定需要</th>
                <th className="px-3 py-2.5">現在枠</th>
                <th className="px-3 py-2.5">推奨追加枠</th>
                <th className="px-3 py-2.5">混雑リスク</th>
                <th className="px-3 py-2.5">管理者ステータス</th>
                <th className="px-3 py-2.5">管理メモ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastRecs.slice(0, 10).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-mono text-slate-700">{r.date}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{r.route_name}</td>
                  <td className="px-3 py-2.5 text-slate-700">{r.predicted_demand.toLocaleString()} 名</td>
                  <td className="px-3 py-2.5 text-slate-700">{r.available_buses} 両</td>
                  <td className="px-3 py-2.5 font-bold text-rose-700">
                    {r.additional_buses_needed > 0 ? `+${r.additional_buses_needed} 両` : '0 両'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="capitalize font-semibold text-slate-700">{r.overcrowding_risk}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      r.manager_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      (r.manager_status === 'revised' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                    }`}>
                      {r.manager_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{r.manager_note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
