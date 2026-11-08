import React, { useEffect, useState } from 'react';
import {
  Sparkles, Send, MessageSquare, CheckCircle2,
  TrendingUp, HelpCircle, RefreshCw, Table as TableIcon
} from 'lucide-react';
import { apiClient } from '../api/client';
import { InsightQueryResponse } from '../types';

export const AiInsightsPage: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [quickPrompts, setQuickPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<InsightQueryResponse | null>(null);

  useEffect(() => {
    apiClient.getQuickPrompts().then((data) => {
      setQuickPrompts(data);
    });
    // Default initial query
    handleAsk("Which route has the highest passenger demand?");
  }, []);

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const res = await apiClient.queryInsights(q);
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            MODULE 8: AI経営・運行インサイトアシスタント
          </span>
          <span className="text-xs text-slate-500">Controlled Natural Language Query Layer</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          富士急行 運行統括 AIアナリティクス・アシスタント
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          自然言語でデータベースおよびAI需要予測モデルへ安全に問い合わせが可能です。
          任意破壊的SQLの実行リスクを排除した厳格なクエリ層により、高精度な数値的根拠と実務的な運行改善施策を即座に導出します。
        </p>
      </div>

      {/* Query Input Box & Quick Prompts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {/* Quick Prompts Chips */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            ワンクリック質問テンプレート (Quick Analytics Inquiries)
          </label>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAsk(p.query)}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>{p.title_ja}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="富士急行の運行需要について質問を入力（例: 最も混雑する曜日は？、明日の追加バスは何両必要？）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>分析実行</span>
          </button>
        </form>
      </div>

      {/* Query Result Card */}
      {response && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">「{response.query}」 に対する分析結果</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 uppercase">
              {response.category}
            </span>
          </div>

          {/* Answer Narrative */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              分析サマリー (Executive Summary)
            </h4>
            <p className="text-sm text-slate-900 leading-relaxed font-medium">
              {response.answer}
            </p>
          </div>

          {/* Key Metrics Chips */}
          {response.key_metrics && Object.keys(response.key_metrics).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                定量的証拠指標 (Supporting Numerical Metrics)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(response.key_metrics).map(([key, val]) => (
                  <div key={key} className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{key.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendation */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>運行改善・経営推奨アクション (Actionable Business Recommendation)</span>
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
              {response.recommendation}
            </p>
          </div>

          {/* Supporting Data Table */}
          {response.supporting_data && response.supporting_data.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-2">
                <TableIcon className="h-4 w-4 text-slate-400" />
                <span>データ内訳詳細 (Tabular Evidence)</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      {Object.keys(response.supporting_data[0]).map((col) => (
                        <th key={col} className="px-3.5 py-2 capitalize font-mono text-[11px]">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {response.supporting_data.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3.5 py-2 text-slate-800">
                            {typeof val === 'number' ? val.toLocaleString() : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
