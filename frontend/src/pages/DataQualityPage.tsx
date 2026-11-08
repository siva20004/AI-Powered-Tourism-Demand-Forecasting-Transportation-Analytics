import React, { useEffect, useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { apiClient } from '../api/client';
import { Dataset } from '../types';

export const DataQualityPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [qualityLogs, setQualityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDatasets();
      setDatasets(data);
      if (data.length > 0) {
        setSelectedDatasetId(data[0].id);
        const logs = await apiClient.getQualityLogs(data[0].id);
        setQualityLogs(logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSelectDataset = async (id: number) => {
    setSelectedDatasetId(id);
    try {
      const logs = await apiClient.getQualityLogs(id);
      setQualityLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            MODULE 2 EXTENSION: データ品質監査台帳
          </span>
          <span className="text-xs text-slate-500">Data Quality Audit & Compliance Logs</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          取込データセット履歴 & 品質検証台帳
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          過去に富士急行システムへ取込まれた全てのデータセット（定期便実績、天候観測、イベント日程）の検証ログと、
          スキーマチェック・異常値検知結果を監査目的で永続管理しています。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Datasets List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">取込データセット一覧 ({datasets.length} 件)</h3>
            <button onClick={fetchDatasets} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {datasets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              まだアップロードされたデータセットはありません。
            </div>
          ) : (
            <div className="space-y-2">
              {datasets.map((ds) => {
                const isSelected = selectedDatasetId === ds.id;
                const score = ds.row_count > 0 ? Math.round((ds.valid_rows / ds.row_count) * 100) : 100;
                return (
                  <button
                    key={ds.id}
                    onClick={() => handleSelectDataset(ds.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{ds.filename}</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-500">{ds.file_format}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>総行数: {ds.row_count.toLocaleString()} 行</span>
                      <span className="font-semibold text-emerald-700">適合率 {score}%</span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(ds.created_at).toLocaleString('ja-JP')}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 cols: Selected Dataset Detail & Quality Logs */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">データセット品質監査詳細</h3>
              <p className="text-xs text-slate-400">ID #{selectedDatasetId ?? 'N/A'} - 適用された自動補正・異常値検出ログ</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              ステータス: 処理確定 (Completed)
            </span>
          </div>

          {qualityLogs.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">データ品質異常は検出されていません</p>
              <p className="text-xs text-slate-400 mt-1">完全な整合性基準を満たした上でデータベースへ格納されています。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qualityLogs.map((log: any) => {
                let detailObj: any = {};
                try {
                  detailObj = JSON.parse(log.details_json || '{}');
                } catch (e) {}

                return (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-mono text-xs font-bold text-slate-800">{log.check_type}</span>
                      </div>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {log.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600">
                      <p>{detailObj.details || '自動補正処理が適用されました。'}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 pt-2">
                      <span>影響件数: {log.issue_count} 件</span>
                      <span>検知時刻: {new Date(log.created_at).toLocaleString('ja-JP')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
