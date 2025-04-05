import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
}

export default function StatCard({ title, value, icon, trend, iconBgColor = 'bg-blue-100' }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`rounded-full ${iconBgColor} p-2`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-2">
          <div className="flex items-center">
            <span className={`${trend.isPositive ? 'text-green-500' : 'text-orange-500'} text-sm flex items-center`}>
              {trend.isPositive ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              {trend.value}%
            </span>
            <span className="text-slate-500 text-xs ml-1">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
