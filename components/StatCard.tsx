
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="min-w-0">
        <p className="text-[10px] sm:text-sm text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-lg sm:text-2xl font-black mt-1 text-slate-800 truncate">{value}</h3>
        {trend && (
          <p className={`text-[10px] mt-2 flex items-center gap-1 font-bold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            <i className={`fas fa-arrow-${trend.isUp ? 'up' : 'down'}`}></i>
            {trend.value}% vs mois dernier
          </p>
        )}
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${color} flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ml-2`}>
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatCard;
