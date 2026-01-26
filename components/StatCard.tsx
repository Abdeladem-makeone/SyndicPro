
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string | number;
    isUp: boolean;
    label?: string;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group min-h-[160px]">
       <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
          </div>
          <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
            <i className="fas fa-ellipsis-h text-xs"></i>
          </div>
       </div>
       
       <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
             {trend && (
                <span className={`text-[10px] font-black flex items-center gap-1 px-2 py-0.5 rounded-lg ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   <i className={`fas ${trend.isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                   {trend.value}%
                </span>
             )}
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
               {trend?.label || "last 30 days"}
             </span>
          </div>
          <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-sm shadow-inner transition-transform group-hover:rotate-12`}>
             <i className={`fas ${icon}`}></i>
          </div>
       </div>
    </div>
  );
};

export default StatCard;
