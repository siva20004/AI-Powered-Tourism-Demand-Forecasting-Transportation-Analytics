import React, { useState, useEffect } from 'react';
import { CloudSun, Clock, ShieldCheck, ChevronDown, Check, UserCircle, Bell } from 'lucide-react';
import { apiClient } from '../api/client';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: 'admin' | 'manager' | 'analyst') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [weatherInfo, setWeatherInfo] = useState<{ cond: string; temp: number }>({ cond: '晴天 (Clear)', temp: 15.2 });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' JST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    apiClient.getCurrentWeather().then((data) => {
      if (data && data.temp_celsius) {
        setWeatherInfo({
          cond: data.condition === 'Clear' ? '晴天 (Clear)' : (data.condition === 'Rain' ? '雨天 (Rain)' : '曇天 (Cloudy)'),
          temp: data.temp_celsius
        });
      }
    }).catch(() => {});
  }, []);

  const roles = [
    { key: 'admin', label: 'DX統括管理者 (Admin)', email: 'admin@fujikyu.co.jp', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
    { key: 'manager', label: '運行管理責任者 (Manager)', email: 'manager@fujikyu.co.jp', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
    { key: 'analyst', label: 'データ分析官 (Analyst)', email: 'analyst@fujikyu.co.jp', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  ];

  const activeRoleObj = roles.find(r => r.key === currentRole) || roles[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuji-navy via-slate-900 to-fuji-blue shadow-sm shadow-blue-900/20">
          {/* Mount Fuji Vector */}
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5L2.5 21h19L12 2.5zm0 5.2l5.5 10.8H6.5L12 7.7z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">FUJITRACK AI</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">v1.0 DX</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">富士急行株式会社 | 富士山観光需要予測・交通計画システム</p>
        </div>
      </div>

      {/* Center: System Status & Live Weather Pill */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Status */}
        <div className="flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>運行システム稼働中 (Normal Ops)</span>
        </div>

        {/* Weather Pill */}
        <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <CloudSun className="h-4 w-4 text-amber-500" />
          <span>河口湖・五合目: {weatherInfo.cond} {weatherInfo.temp}°C</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono text-slate-700">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{timeStr || '12:00:00 JST'}</span>
        </div>
      </div>

      {/* Right: Role Switcher & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Role Selector Dropdown for Portfolio Testing */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${activeRoleObj.badge}`}>
              {activeRoleObj.key.toUpperCase()}
            </span>
            <span className="hidden sm:inline text-slate-800">{activeRoleObj.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-2 border-b border-slate-100 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                権限切替 (Role Switcher for Evaluation)
              </div>
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    onRoleChange(r.key as any);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    currentRole === r.key ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-[10px] text-slate-400">{r.email}</p>
                  </div>
                  {currentRole === r.key && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center space-x-2 pl-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
