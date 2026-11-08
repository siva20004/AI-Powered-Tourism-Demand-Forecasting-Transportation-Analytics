import React, { useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle,
  Download, ArrowRight, RefreshCw, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { apiClient } from '../api/client';
import { QualityReport } from '../types';

export const DataUploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setErrorMsg('対応外のファイル形式です。.csv、.xlsx、.xls ファイルを選択してください。');
      setSelectedFile(null);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.uploadFile(selectedFile);
      setReport(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'データ処理中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
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
                MODULE 2: データ統合・ETLパイプライン
              </span>
              <span className="text-xs text-slate-500">CSV / Excel 自動検証・補正エンジン</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              運行・乗客需要データ 取込 & データエンジニアリング
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              各営業所（富士山営業所・河口湖営業所等）から送付される乗客輸送データ、天候データ、またはイベントカレンダーをアップロードしてください。
              欠損値補完、日付正規化、重複排除、スキーマ検証を完全自動で実行し、PostgreSQLへ格納します。
            </p>
          </div>

          {/* Instant Sample Download buttons for quick testing */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href="/api/upload/sample/csv"
              download
              className="flex items-center justify-center space-x-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>テスト用サンプル CSV 入手</span>
            </a>
            <a
              href="/api/upload/sample/xlsx"
              download
              className="flex items-center justify-center space-x-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>テスト用サンプル Excel 入手</span>
            </a>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-base font-bold text-slate-800">
          ファイルをここにドラッグ＆ドロップ、またはファイルを選択
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          対応フォーマット: CSV (.csv), Microsoft Excel (.xlsx, .xls) / 最大50MB
        </p>

        <input
          type="file"
          id="fileUpload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <label
          htmlFor="fileUpload"
          className="mt-4 cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          ファイルを参照して選択
        </label>

        {selectedFile && (
          <div className="mt-5 flex items-center space-x-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-2 text-xs text-blue-900">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-semibold">{selectedFile.name}</span>
            <span className="text-slate-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-xs text-rose-600 hover:underline font-medium ml-2"
            >
              解除
            </button>
          </div>
        )}

        {selectedFile && (
          <button
            onClick={handleUploadAndProcess}
            disabled={isProcessing}
            className="mt-4 flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>データ検証・ETLパイプライン実行中...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>パイプライン実行 (検証 & PostgreSQL保存)</span>
              </>
            )}
          </button>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Quality Report Results Card */}
      {report && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">データエンジニアリング検証レポート (Data Quality Audit)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">処理完了ファイル: {report.filename}</p>
            </div>

            {/* Quality Score Badge */}
            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">品質スコア (Quality Score)</p>
                <p className="text-xl font-extrabold text-emerald-700">{report.data_quality_score_pct}%</p>
              </div>

              {report.download_url && (
                <a
                  href={report.download_url}
                  download
                  className="flex items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>クレンジング済データ取得</span>
                </a>
              )}
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
              <p className="text-xs text-slate-500 font-medium">総取込行数</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{report.total_rows.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-center">
              <p className="text-xs text-emerald-700 font-medium">有効確定レコード</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-800">{report.valid_rows.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-center">
              <p className="text-xs text-amber-700 font-medium">欠損値補完数</p>
              <p className="mt-1 text-lg font-extrabold text-amber-800">{report.missing_values_count}</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-center">
              <p className="text-xs text-rose-700 font-medium">重複排除件数</p>
              <p className="mt-1 text-lg font-extrabold text-rose-800">{report.duplicate_rows_count}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3.5 text-center">
              <p className="text-xs text-blue-700 font-medium">DB保存ステータス</p>
              <p className="mt-1 text-xs font-bold text-blue-800 uppercase">完了 (Ingested)</p>
            </div>
          </div>

          {/* Detected Issues & Corrective Actions Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2">検出ログ及び適用された補正処理 (Audit Trail)</h4>
            {report.issues.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                ✔ データ品質チェック合格: 欠損値・重複・形式不正は一切検出されませんでした。
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">チェック項目 (Check Type)</th>
                      <th className="px-4 py-2.5">重大度 (Severity)</th>
                      <th className="px-4 py-2.5">該当件数 (Count)</th>
                      <th className="px-4 py-2.5">適用された自動補正内容 (ETL Resolution)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.issues.map((iss, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-slate-800 font-medium">{iss.check_type}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              iss.severity === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {iss.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{iss.count} 件</td>
                        <td className="px-4 py-2.5 text-slate-600">{iss.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
