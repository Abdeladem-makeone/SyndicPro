
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
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1.5">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight truncate">{value}</h3>
        {trend && (
          <p className={`text-[10px] mt-3 flex items-center gap-1.5 font-black uppercase tracking-wider ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            <i className={`fas fa-caret-${trend.isUp ? 'up' : 'down'}`}></i>
            {trend.value}% <span className="opacity-50">vs mois d'avant</span>
          </p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-3xl ${color} flex items-center justify-center text-xl flex-shrink-0 ml-4 group-hover:scale-110 transition-transform shadow-inner`}>
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatCard;
