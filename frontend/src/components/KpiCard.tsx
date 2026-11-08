import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  titleJa: string;
  titleEn: string;
  value: string | number;
  subtext?: string;
  changePct?: number;
  icon: LucideIcon;
  badge?: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  titleJa,
  titleEn,
  value,
  subtext,
  changePct,
  icon: Icon,
  badge,
  accentColor = 'blue',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-700',
      accent: 'border-l-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-700',
      accent: 'border-l-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-100 text-amber-700',
      accent: 'border-l-amber-600',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-100 text-rose-700',
      accent: 'border-l-rose-600',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-100 text-indigo-700',
      accent: 'border-l-indigo-600',
    },
  };

  const theme = colorMap[accentColor];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md border-l-4 ${theme.accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-1.5">
            <h4 className="text-sm font-bold text-slate-800">{titleJa}</h4>
            {badge && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${theme.bg}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium">{titleEn}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {changePct !== undefined && (
          <div className={`flex items-center text-xs font-semibold ${changePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {changePct >= 0 ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            <span>{Math.abs(changePct)}%</span>
          </div>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2">
          {subtext}
        </p>
      )}
    </div>
  );
};
