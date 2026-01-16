
import React from 'react';
import StatCard from '../components/StatCard';
import { Apartment, Expense, Payment, BuildingInfo, AssetPayment } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';

interface DashboardProps {
  apartments: Apartment[];
  expenses: Expense[];
  payments: Payment[];
  assetPayments?: AssetPayment[];
  buildingInfo: BuildingInfo;
}

const Dashboard: React.FC<DashboardProps> = ({ apartments, expenses, payments, assetPayments = [], buildingInfo }) => {
  const filteredExpenses = expenses.filter(e => !e.excludedFromReports);
  
  const apartmentRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const assetRevenue = assetPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = apartmentRevenue + assetRevenue;
  
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalCollected - totalExpenses;
  
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentDay = new Date().getDate();

  const expectedRevenue = apartments.reduce((sum, a) => sum + a.monthlyFee, 0) * 12;
  const collectionRate = expectedRevenue > 0 ? (apartmentRevenue / expectedRevenue) * 100 : 0;

  const expenseData = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const unpaidCurrentMonth = apartments.filter(apt => 
    !payments.some(p => p.apartmentId === apt.id && p.month === currentMonthIdx && p.year === currentYear)
  );

  const showAutoReminder = buildingInfo.autoRemindersEnabled && unpaidCurrentMonth.length > 0 && currentDay > 20;

  return (
    <div className="space-y-8 pb-12">
      {showAutoReminder && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl animate-pulse">
              <i className="fas fa-bell"></i>
            </div>
            <div>
              <h4 className="font-bold text-red-800 text-lg">Fin de mois : {unpaidCurrentMonth.length} impayés détectés !</h4>
              <p className="text-red-700 text-sm">Des propriétaires n'ont pas encore réglé. Une relance est suggérée.</p>
            </div>
          </div>
          <Link to="/reminders" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">Aller au Centre de Rappel</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Total Encaissé" value={`${totalCollected.toLocaleString()} DH`} icon="fa-wallet" color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Total Dépenses" value={`${totalExpenses.toLocaleString()} DH`} icon="fa-money-bill-transfer" color="bg-red-100 text-red-600" />
        <StatCard title="Solde Actuel" value={`${balance.toLocaleString()} DH`} icon="fa-scale-balanced" color="bg-green-100 text-green-600" />
        <StatCard title="Impayés (Mois)" value={unpaidCurrentMonth.length} icon="fa-exclamation-circle" color="bg-red-50 text-red-500" />
        <StatCard title="Recouvrement" value={`${collectionRate.toFixed(1)} %`} icon="fa-percent" color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotisations Apparts</p>
                 <p className="text-2xl font-black text-slate-800">{apartmentRevenue.toLocaleString()} DH</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenus des Biens</p>
                 <p className="text-2xl font-black text-indigo-600">{assetRevenue.toLocaleString()} DH</p>
              </div>
           </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Répartition des Dépenses</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Dernières Dépenses</h3>
            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.slice(-8).reverse().map((expense) => (
                  <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors ${expense.excludedFromReports ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs"><i className="fas fa-file-invoice"></i></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{expense.description}</p>
                        <p className="text-[10px] text-slate-400">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <p className={`text-xs font-black ${expense.excludedFromReports ? 'text-slate-300' : 'text-red-500'}`}>-{expense.amount} DH</p>
                  </div>
                ))
              ) : <p className="text-center text-slate-400 py-8 italic text-sm">Aucune dépense.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
