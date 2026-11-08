import React, { useEffect, useState } from 'react';
import {
  Settings, Users, ShieldCheck, Database,
  Activity, RefreshCw, KeyRound, Server
} from 'lucide-react';
import { apiClient } from '../api/client';
import { User, AuditLog } from '../types';

export const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const [uList, logs, hData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getAuditLogs(),
        apiClient.getHealth()
      ]);
      setUsers(uList);
      setAuditLogs(logs);
      setHealth(hData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
            MODULE 10: ユーザー権限管理・セキュリティ & 監査ログ
          </span>
          <span className="text-xs text-slate-500">RBAC, System Health & Audit Logging</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          システム管理・ユーザー権限・セキュリティ監査ログ
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          ロールベースアクセス制御（管理者・運行管理者・分析官）、JWT認証、および全操作（データアップロード、モデル再学習、配車承認、レポート出力）の監査ログを記録・管理します。
        </p>
      </div>

      {/* System Health Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <Server className="h-4 w-4 text-blue-600" />
            <span>FastAPI サービス状態</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 capitalize">{health?.status ?? 'Healthy'}</p>
          <p className="text-xs text-slate-400 mt-1">Version: {health?.version ?? '1.0.0'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>データベース接続</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 capitalize">{health?.database ?? 'Connected'}</p>
          <p className="text-xs text-slate-400 mt-1">Dual SQLite / PostgreSQL</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase mb-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <span>認証・セキュリティ方式</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">JWT + PBKDF2</p>
          <p className="text-xs text-slate-400 mt-1">Role-Based Access Control</p>
        </div>
      </div>

      {/* Users List & Permissions Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3">登録ユーザーアカウント一覧</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">氏名 (Full Name)</th>
                <th className="px-4 py-2.5">メールアドレス (Email)</th>
                <th className="px-4 py-2.5">所属部署 (Department)</th>
                <th className="px-4 py-2.5">権限ロール (Role)</th>
                <th className="px-4 py-2.5">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{u.full_name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-700">{u.department}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      u.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                      (u.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-emerald-700 font-semibold">有効 (Active)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">システムセキュリティ監査ログ (Audit Log Trail)</h3>
            <p className="text-xs text-slate-400">直近の重要操作・承認・モデル更新記録</p>
          </div>
          <button onClick={fetchSettingsData} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5">操作時刻</th>
                <th className="px-3.5 py-2.5">実行ユーザー</th>
                <th className="px-3.5 py-2.5">アクション (Action)</th>
                <th className="px-3.5 py-2.5">対象リソース</th>
                <th className="px-3.5 py-2.5">詳細内容</th>
                <th className="px-3.5 py-2.5">IPアドレス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-800">{log.user_email || 'System'}</td>
                  <td className="px-3.5 py-2.5 font-bold text-blue-700">{log.action}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">{log.resource}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 max-w-sm truncate">{log.details || '—'}</td>
                  <td className="px-3.5 py-2.5 text-slate-400">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
