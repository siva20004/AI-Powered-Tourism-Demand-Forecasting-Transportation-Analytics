import React, { useEffect, useState } from 'react';
import {
  CloudRain, Sun, Thermometer, Wind,
  AlertCircle, ShieldAlert, RefreshCw, Umbrella
} from 'lucide-react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar
} from 'recharts';
import { apiClient } from '../api/client';
import { WeatherImpactResponse } from '../types';

export const WeatherSeasonalPage: React.FC = () => {
  const [data, setData] = useState<WeatherImpactResponse | null>(null);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const [impact, current] = await Promise.all([
          apiClient.getWeatherImpact(),
          apiClient.getCurrentWeather()
        ]);
        setData(impact);
        setCurrentWeather(current);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const seasonChartData = data?.summary?.season_distribution
    ? Object.entries(data.summary.season_distribution).map(([season, count]) => ({
        season,
        passengers: count
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                MODULE 5: 天候・祝祭日・季節影響分析
              </span>
              <span className="text-xs text-slate-500">External Meteorological & Seasonal Impact</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              気象条件（降雨・気温）および祝祭日と観光需要の相関分析
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              富士五湖地域特有の気象データ（富士山駅・河口湖駅・五合目）と輸送実績を照合。
              雨天時の五合目線減少率とアウトレット・周遊バスへのシフト動態を解析します。
            </p>
          </div>

          {/* Current Live Weather Widget */}
          {currentWeather && (
            <div className="flex items-center space-x-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-900 shadow-inner">
              <Sun className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">{currentWeather.location}</p>
                <p className="text-[11px] text-sky-700">
                  {currentWeather.condition} | {currentWeather.temp_celsius}°C | 風速 {currentWeather.wind_speed_kmh} km/h
                </p>
                <p className="text-[9px] text-sky-500 mt-0.5">{currentWeather.source}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Statistical Non-Causation Disclaimer */}
      {data?.disclaimer && (
        <div className="flex items-start space-x-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">統計的分析における留意事項 (Important Analytical Disclaimer)</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">{data.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">平日 基準輸送量</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{data.summary.weekday_avg?.toLocaleString()} 名/日</p>
            <p className="mt-1 text-[11px] text-slate-400">標準運行ダイヤベース</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-blue-800">祝祭日・GW輸送量</p>
            <p className="mt-2 text-2xl font-extrabold text-blue-900">{data.summary.holiday_avg?.toLocaleString()} 名/日</p>
            <p className="mt-1 text-[11px] text-blue-700 font-semibold">年間最大の運行集中期</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-rose-800">降雨時 (5mm以上) 需要変動</p>
            <p className="mt-2 text-2xl font-extrabold text-rose-900">{data.summary.rain_impact_pct}%</p>
            <p className="mt-1 text-[11px] text-rose-700 font-semibold">屋外・五合目観光の自粛傾向</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-emerald-800">年間最大ピークシーズン</p>
            <p className="mt-2 text-lg font-extrabold text-emerald-900">{data.summary.peak_season}</p>
            <p className="mt-1 text-[11px] text-emerald-700">夏山登山 7月〜8月集中</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rainfall vs Ridership Scatter / Correlation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">日降水量 (mm) vs 輸送乗客数 (Correlation)</h3>
            <p className="text-xs text-slate-500">降雨量増加に伴う旅客需要の減衰傾向</p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" dataKey="rainfall_mm" name="降水量" unit="mm" tick={{ fontSize: 11 }} />
                <YAxis type="number" dataKey="passengers" name="乗客数" unit="名" tick={{ fontSize: 11 }} />
                <ZAxis range={[40, 120]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="運行実績" data={data?.impact_data || []} fill="#0284c7" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Four Seasons Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">四季別 累計観光輸送需要 (Seasonal Breakdown)</h3>
            <p className="text-xs text-slate-500">春(桜/芝桜)・夏(登山)・秋(紅葉)・冬(雪富士)のボリューム</p>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} 名`, '累計旅客']} />
                <Bar dataKey="passengers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
