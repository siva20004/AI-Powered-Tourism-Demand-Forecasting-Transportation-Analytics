import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  CheckCircle2,
  LineChart,
  BrainCircuit,
  CloudRain,
  Bus,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const menuItems = [
    { id: 'overview', labelJa: '役員ダッシュボード', labelEn: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'upload', labelJa: 'データ投入・ETL', labelEn: 'Data Upload & Pipeline', icon: UploadCloud },
    { id: 'quality', labelJa: 'データ品質監査', labelEn: 'Data Quality Logs', icon: CheckCircle2 },
    { id: 'analytics', labelJa: '旅客動態分析', labelEn: 'Passenger Analytics', icon: LineChart },
    { id: 'forecasting', labelJa: 'AI需要予測', labelEn: 'Demand Forecasting', icon: BrainCircuit, badge: 'ML' },
    { id: 'weather', labelJa: '天候・祝祭日分析', labelEn: 'Weather & Seasonal', icon: CloudRain },
    { id: 'capacity', labelJa: 'バス配車適正化', labelEn: 'Bus Capacity Planning', icon: Bus, badge: 'AI' },
    { id: 'routes', labelJa: '路線別採算・稼働率', labelEn: 'Route Performance', icon: TrendingUp },
    { id: 'insights', labelJa: 'AI運行インサイト', labelEn: 'AI Business Insights', icon: Sparkles, badge: 'NLP' },
    { id: 'reports', labelJa: '業務レポート生成', labelEn: 'Automated Reports', icon: FileSpreadsheet },
    { id: 'settings', labelJa: '設定・監査ログ', labelEn: 'Settings & Audit', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle collapse button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? 'MENU' : 'MAIN MODULES (機能一覧)'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-sm shadow-blue-900/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? `${item.labelJa} (${item.labelEn})` : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-blue-200' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />

              {!collapsed && (
                <div className="ml-3 flex flex-1 items-center justify-between overflow-hidden">
                  <div className="truncate">
                    <p className={`font-semibold ${isActive ? 'text-white' : 'text-slate-800'}`}>{item.labelJa}</p>
                    <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{item.labelEn}</p>
                  </div>
                  {item.badge && (
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info: Mt. Fuji Region scope */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl border border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-red-600" />
            <span>管轄地域: 富士山・富士五湖</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 leading-tight">
            河口湖・五合目・忍野八海・新倉山忠霊塔・新宿高速線
          </p>
          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200/60 pt-1.5">
            <span>Fuji Kyuko Co., Ltd.</span>
            <span>DX Verified</span>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center">
          <MapPin className="mx-auto h-4 w-4 text-red-500" />
        </div>
      )}
    </aside>
  );
};
