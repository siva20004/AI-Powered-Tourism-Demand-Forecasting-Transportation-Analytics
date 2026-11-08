import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet, FileText, Download, CheckCircle2,
  Calendar, RefreshCw, FileCode, Clock
} from 'lucide-react';
import { apiClient } from '../api/client';
import { GeneratedReport, Route } from '../types';

export const ReportsPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [reportType, setReportType] = useState<string>('daily');
  const [format, setFormat] = useState<string>('pdf');
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedList, setGeneratedList] = useState<GeneratedReport[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getRoutes().then((data) => setRoutes(data));
    fetchReportsList();
  }, []);

  const fetchReportsList = async () => {
    try {
      const list = await apiClient.getReportsList();
      setGeneratedList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuccessMsg(null);
    try {
      const res = await apiClient.generateReport({
        report_type: reportType,
        format: format,
        route_id: selectedRouteId
      });
      setSuccessMsg(`レポート「${res.title}」を生成しました (${res.format.toUpperCase()}形式, ${res.file_size_kb} KB)`);
      fetchReportsList();
    } catch (err: any) {
      alert('レポート生成エラー: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportOptions = [
    { id: 'daily', nameJa: '日次運行実績・旅客需要レポート', nameEn: 'Daily Passenger & Dispatch Report' },
    { id: 'weekly', nameJa: '週次交通需要・運行計画レポート', nameEn: 'Weekly Transportation & Demand Report' },
    { id: 'monthly', nameJa: '月次観光動態・旅客分析レポート', nameEn: 'Monthly Tourism Demand Analytics' },
    { id: 'forecast', nameJa: 'AI旅客需要予測・変動分析レポート', nameEn: 'Passenger Demand Forecast Report' },
    { id: 'route', nameJa: '路線別採算・稼働率評価レポート', nameEn: 'Route Performance & Utilization Report' },
    { id: 'capacity', nameJa: 'バス配車最適化・安全予備率評価レポート', nameEn: 'Bus Capacity Recommendation Report' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            MODULE 9: 定型業務レポート自動生成
          </span>
          <span className="text-xs text-slate-500">Automated Enterprise Report Exports</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          定型業務レポート出力 (PDF / Excel / CSV)
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          役員会提出用の日次・週次・月次の運行総括資料、AI需要予測の推移グラフ付きPDF、
          および配車計画・安全予備率評価シートをワンクリックで生成・エクスポートします。
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Generator Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          新規レポート生成パラメータ指定
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">レポート種別 (Report Type)</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.nameJa}
                </option>
              ))}
            </select>
          </div>

          {/* Export Format */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">出力フォーマット (Export Format)</label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex items-center justify-center space-x-1 rounded-lg py-1.5 transition-all ${
                  format === 'pdf' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>PDF 文書</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center justify-center space-x-1 rounded-lg py-1.5 transition-all ${
                  format === 'xlsx' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Excel 帳票</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center space-x-1 rounded-lg py-1.5 transition-all ${
                  format === 'csv' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>CSV データ</span>
              </button>
            </div>
          </div>

          {/* Route Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">対象路線スコープ</label>
            <select
              value={selectedRouteId ?? ''}
              onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">富士急行 全線一括 (All Mt. Fuji Routes)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_code}: {r.name_ja}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isGenerating ? 'レポート生成中...' : 'レポートを生成・出力'}</span>
          </button>
        </div>
      </div>

      {/* Generated Reports History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">生成済レポート履歴 ({generatedList.length} 件)</h3>
            <p className="text-xs text-slate-400">直近生成されたエクスポートファイルとダウンロードリンク</p>
          </div>
          <button onClick={fetchReportsList} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">形式</th>
                <th className="px-4 py-3">レポート名称</th>
                <th className="px-4 py-3">集計期間</th>
                <th className="px-4 py-3">ファイル容量</th>
                <th className="px-4 py-3">生成日時</th>
                <th className="px-4 py-3 text-right">ダウンロード</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {generatedList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.format === 'pdf' ? 'bg-rose-100 text-rose-800' :
                      (r.format === 'xlsx' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800')
                    }`}>
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{r.title}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r.period_start} 〜 {r.period_end}</td>
                  <td className="px-4 py-3 text-slate-500">{r.file_size_kb} KB</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleString('ja-JP')}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={r.download_url}
                      download
                      className="inline-flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                      <span>ダウンロード</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
