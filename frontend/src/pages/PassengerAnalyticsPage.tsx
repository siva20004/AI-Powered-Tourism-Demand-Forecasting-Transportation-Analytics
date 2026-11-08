import React, { useEffect, useState } from 'react';
import {
  Calendar, Filter, LineChart as ChartIcon,
  Clock, ArrowUpDown, RefreshCw, MapPin
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';
import { apiClient } from '../api/client';
import { Route } from '../types';

export const PassengerAnalyticsPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>(undefined);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weekendStats, setWeekendStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient.getRoutes().then((data) => {
      setRoutes(data);
    });
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [daily, peak, monthly, wknd] = await Promise.all([
        apiClient.getDailyAnalytics(undefined, undefined, selectedRouteId),
        apiClient.getPeakHours(selectedRouteId),
        apiClient.getMonthlyAnalytics(selectedRouteId),
        apiClient.getWeekendComparison(selectedRouteId)
      ]);
      setDailyData(daily.slice(-45)); // last 45 days
      setPeakHours(peak);
      setMonthlyData(monthly);
      setWeekendStats(wknd);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedRouteId]);

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                MODULE 3: 旅客動態・運行実績分析
              </span>
              <span className="text-xs text-slate-500">Historical Passenger Traffic Analysis</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              富士山エリア 旅客動態・時間帯・曜日別分析
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              路線別・時間帯別・曜日別の旅客流動パターンを可視化。週末集中やピーク時間帯（午前の上り、夕方の下り）の偏りを把握し、運行ダイヤの最適化に資するデータを提供します。
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={selectedRouteId ?? ''}
              onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全路線一括集計 (All Mt. Fuji Routes)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_code} : {r.name_ja}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekend vs Weekday Surge Metric Card */}
      {weekendStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">平日 平均輸送規模 (Weekday Avg)</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{weekendStats.weekday_average?.toLocaleString()} 名/日</p>
            <p className="mt-1 text-xs text-slate-400">月曜〜金曜 日次平均実績</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-blue-800 uppercase">週末 平均輸送規模 (Weekend Avg)</p>
            <p className="mt-2 text-2xl font-extrabold text-blue-900">{weekendStats.weekend_average?.toLocaleString()} 名/日</p>
            <p className="mt-1 text-xs text-blue-700 font-semibold">平日比 +{weekendStats.difference_pct}% 増加</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">運行施策インサイト (Ops Insight)</p>
            <p className="mt-2 text-xs text-slate-700 font-medium leading-relaxed">
              {weekendStats.weekend_surge_description || '週末の観光需要集中に対応し、待機バスの稼働準備が必要です。'}
            </p>
          </div>
        </div>
      )}

      {/* Daily Passenger Trend (Boardings vs Alightings) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">日次 旅客輸送動態 (乗車数 vs 降車数)</h3>
            <p className="text-xs text-slate-500">直近45日間の旅客量推移</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5 text-blue-700">
              <span className="h-3 w-3 rounded-full bg-blue-600"></span>
              <span>乗車数 (Boardings)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-700">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              <span>降車数 (Alightings)</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="alightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${Number(val).toLocaleString()} 名`,
                  name === 'boardings' ? '乗車' : (name === 'alightings' ? '降車' : '総旅客')
                ]}
              />
              <Area type="monotone" dataKey="boardings" stroke="#2563eb" fill="url(#boardGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="alightings" stroke="#10b981" fill="url(#alightGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Peak Hours & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Histogram */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">時間帯別 旅客集中度 (Peak Hours Distribution)</h3>
            <p className="text-xs text-slate-500">運行時間帯 (07:00〜20:00) の混雑ヒストグラム</p>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} 名`, '輸送乗客数']}
                />
                <Bar dataKey="passenger_count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Seasonality Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">月次 観光旅客変動 (Monthly Seasonality)</h3>
            <p className="text-xs text-slate-500">夏山登山・桜・紅葉の季節波動分析</p>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} 名`, '月間旅客数']}
                />
                <Bar dataKey="passengers" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
