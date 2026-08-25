import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  onClick
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              trend.isPositive
                ? 'text-green-500 bg-green-50'
                : 'text-red-500 bg-red-50'
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>

      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-2">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
};
