import React, { useEffect, useState } from 'react';
import { TrendingUp, MapPin, Gauge, Clock, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Route } from '../types';

export const RoutePerformancePage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routePerfMap, setRoutePerfMap] = useState<Record<number, any>>({});
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRoutesAndPerf = async () => {
      setLoading(true);
      try {
        const routeList = await apiClient.getRoutes();
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRouteId(routeList[0].id);
        }

        const perfPromises = routeList.map(r => apiClient.getRoutePerformance(r.id));
        const perfs = await Promise.all(perfPromises);
        const map: Record<number, any> = {};
        perfs.forEach((p, idx) => {
          map[routeList[idx].id] = p;
        });
        setRoutePerfMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutesAndPerf();
  }, []);

  const selectedPerf = selectedRouteId ? routePerfMap[selectedRouteId] : null;

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            MODULE 7: 路線別採算・稼働率分析
          </span>
          <span className="text-xs text-slate-500">Route-Level Operational Performance</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          富士急行 路線別 運行効率・乗車率・混雑ランキング
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          富士五湖周遊バス、富士スバルライン五合目直行シャトル、新宿高速バスの各運行系統を、
          輸送規模・平均乗客数・座席稼働率・ピーク時間帯に基づき多角的に評価します。
        </p>
      </div>

      {/* Main Routes Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">全路線 稼働実績一覧 (Route Fleet Index)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">路線コード</th>
                <th className="px-4 py-3">路線名 (日本語 / 英語)</th>
                <th className="px-4 py-3">区間 (起点 ⇄ 終点)</th>
                <th className="px-4 py-3">運行距離 / 所要時間</th>
                <th className="px-4 py-3">累計乗客数</th>
                <th className="px-4 py-3">1日平均需要</th>
                <th className="px-4 py-3">稼働率</th>
                <th className="px-4 py-3">運行評価ステータス</th>
                <th className="px-4 py-3 text-right">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routes.map((r) => {
                const perf = routePerfMap[r.id];
                const isSelected = selectedRouteId === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-bold">{r.route_code}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 font-bold">{r.name_ja}</p>
                      <p className="text-[11px] text-slate-400">{r.name_en}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.origin_station} ⇄ {r.destination_station}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.distance_km} km ({r.standard_duration_min} 分)
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {perf?.total_passengers?.toLocaleString() ?? '—'} 名
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {perf?.avg_daily_passengers?.toLocaleString() ?? '—'} 名/日
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900">{perf?.estimated_utilization_pct ?? '—'}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        perf?.congestion_badge?.includes('High')
                          ? 'bg-rose-100 text-rose-800'
                          : (perf?.congestion_badge?.includes('Standard')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800')
                      }`}>
                        {perf?.congestion_badge ?? '集計中'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      <ChevronRight className="h-4 w-4 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Route Deep-Dive Card */}
      {selectedPerf && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-blue-700">{selectedPerf.route_code}</span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {selectedPerf.name_ja} ({selectedPerf.name_en}) 運行詳細分析
              </h3>
            </div>
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              全路線需要順位: {selectedPerf.system_demand_rank}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <p className="text-xs text-slate-500 font-medium">混雑ピーク時間帯</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{selectedPerf.peak_hour}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <p className="text-xs text-slate-500 font-medium">1日平均輸送実績</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{selectedPerf.avg_daily_passengers.toLocaleString()} 名</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <p className="text-xs text-slate-500 font-medium">標準片道所要</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">{selectedPerf.standard_duration_min} 分</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <p className="text-xs text-slate-500 font-medium">推定運行効率評価</p>
              <p className="mt-1 text-xs font-bold text-slate-800 leading-tight">{selectedPerf.congestion_badge}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
