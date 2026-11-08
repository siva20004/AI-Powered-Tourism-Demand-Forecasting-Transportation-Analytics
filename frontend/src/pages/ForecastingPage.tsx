import React, { useEffect, useState } from 'react';
import {
  BrainCircuit, Calendar, RefreshCw, Target,
  CheckCircle2, ArrowRight, Layers, Sliders, ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Line
} from 'recharts';
import { apiClient } from '../api/client';
import { Route, ForecastResponse, ModelMetric } from '../types';

export const ForecastingPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>(undefined);
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [modelType, setModelType] = useState<string>('gradient_boosting');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getRoutes().then((data) => setRoutes(data));
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const data = await apiClient.getModels();
      setModels(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getForecast(horizonDays, selectedRouteId, modelType);
      setForecast(data);
    } catch (err) {
      console.error('Forecast fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [horizonDays, selectedRouteId, modelType]);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await apiClient.retrainModel(modelType, selectedRouteId);
      setRetrainSuccess(`モデル「${modelType}」の再学習が完了しました。MAE: ${res.metrics.mae}, R²: ${res.metrics.r2}`);
      await fetchModels();
      await fetchForecast();
    } catch (err: any) {
      alert('再学習に失敗しました: ' + err.message);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                MODULE 4 (CORE): AI需要予測エンジン
              </span>
              <span className="text-xs text-slate-500">Time-Series Machine Learning Pipeline</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              AI乗客需要予測 & 95%予測区間シミュレーション
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              時系列ラグ特徴量（t-1, t-7）、移動平均（7日/14日）、日本の祝祭日カレンダー、および気象データを融合し、
              翌日・週間（7日）・月間（30日）の旅客需要を予測区間付きで高精度算出します。
            </p>
          </div>

          {/* Model Retraining button */}
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center space-x-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'モデル再学習中...' : '最新データでモデル再学習'}</span>
          </button>
        </div>

        {retrainSuccess && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{retrainSuccess}</span>
          </div>
        )}
      </div>

      {/* Control Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Route Select */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">対象路線 (Target Route)</label>
          <select
            value={selectedRouteId ?? ''}
            onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">全路線一括集計 (All Mt. Fuji Routes)</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.route_code}: {r.name_ja}
              </option>
            ))}
          </select>
        </div>

        {/* Forecast Horizon Tabs */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">予測期間 (Forecast Horizon)</label>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setHorizonDays(1)}
              className={`rounded-lg py-1.5 transition-all ${
                horizonDays === 1 ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              翌日 (1日)
            </button>
            <button
              onClick={() => setHorizonDays(7)}
              className={`rounded-lg py-1.5 transition-all ${
                horizonDays === 7 ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              週間 (7日)
            </button>
            <button
              onClick={() => setHorizonDays(30)}
              className={`rounded-lg py-1.5 transition-all ${
                horizonDays === 30 ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              月間 (30日)
            </button>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">予測アルゴリズム (ML Model)</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="gradient_boosting">Gradient Boosting (高精度アンサンブル - 推奨)</option>
            <option value="random_forest">Random Forest (頑健木構造モデル)</option>
            <option value="ridge_baseline">Ridge Regression (線形ベースライン)</option>
          </select>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Band */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                向こう {horizonDays} 日間 需要予測カーブ & 95% 信頼区間
              </h3>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                {forecast?.model_name || modelType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              対象: {forecast?.route_name} | 決定係数 R²: {forecast?.r2_score} | MAE: {forecast?.mae} 名
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5 text-purple-700">
              <span className="h-3 w-3 rounded-full bg-purple-600"></span>
              <span>AI予測中央値 (Point Estimate)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-500">
              <span className="h-3 w-3 rounded bg-purple-100 border border-purple-300"></span>
              <span>95% 予測区間 (Upper/Lower Range)</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.predictions || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="forecast_date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${Number(v).toLocaleString()}`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${Number(val).toLocaleString()} 名`,
                  name === 'predicted' ? '予測中央値' : (name === 'upper_bound' ? '予測上限 (+95%)' : '予測下限 (-95%)')
                ]}
                labelFormatter={(lbl) => `予測対象日: ${lbl}`}
              />
              <Area type="monotone" dataKey="upper_bound" stroke="#c084fc" strokeDasharray="3 3" fill="transparent" />
              <Area type="monotone" dataKey="predicted" stroke="#9333ea" strokeWidth={3} fill="url(#forecastArea)" />
              <Area type="monotone" dataKey="lower_bound" stroke="#c084fc" strokeDasharray="3 3" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Models Comparison Table & Feature Engineering Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Evaluation Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">学習済モデル性能比較 (Model Benchmark)</h3>
            <p className="text-xs text-slate-400">時系列検証セット（検証分割）における評価指標</p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">モデル種別</th>
                  <th className="px-3 py-2.5">MAE (平均絶対誤差)</th>
                  <th className="px-3 py-2.5">RMSE (二乗平均誤差)</th>
                  <th className="px-3 py-2.5">R² スコア</th>
                  <th className="px-3 py-2.5">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {models.map((m) => (
                  <tr key={m.id} className={m.model_type === modelType ? 'bg-purple-50/50 font-bold' : ''}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m.model_name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{m.mae} 名</td>
                    <td className="px-3 py-2.5 text-slate-700">{m.rmse} 名</td>
                    <td className="px-3 py-2.5 text-emerald-700">{m.r2}</td>
                    <td className="px-3 py-2.5">
                      {m.is_active ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                          STANDBY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Engineering Architecture */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">特徴量エンジニアリング構成 (Engineered Features)</h3>
            <p className="text-xs text-slate-400">未来情報リークを厳密に排除した時系列特徴量</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-bold text-slate-800 block">時系列ラグ (Time Lags)</span>
              <p className="text-[11px] text-slate-500 mt-1">
                前日乗客数 (t-1)、前週同曜日乗客数 (t-7)。週次サイクルの自己相関を捉えます。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-bold text-slate-800 block">移動平均窓 (Rolling Windows)</span>
              <p className="text-[11px] text-slate-500 mt-1">
                7日間・14日間のシフト移動平均。基調トレンドの上下変動を平滑化します。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-bold text-slate-800 block">カレンダー & 祝祭日指標</span>
              <p className="text-[11px] text-slate-500 mt-1">
                曜日 (0-6)、月 (1-12)、土日フラグ、日本の国民の祝日、GW・お盆連休フラグ。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-bold text-slate-800 block">気象・季節環境要因</span>
              <p className="text-[11px] text-slate-500 mt-1">
                気温 (°C)、日降水量 (mm)、富士山夏山開山期、紅葉まつり、芝桜期区分。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
