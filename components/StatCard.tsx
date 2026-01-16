
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            <i className={`fas fa-arrow-${trend.isUp ? 'up' : 'down'}`}></i>
            {trend.value}% par rapport au mois dernier
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-xl`}>
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatCard;
