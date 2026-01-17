
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
    <div className="space-y-6 sm:space-y-8 pb-12 w-full">
      {showAutoReminder && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-lg sm:text-xl animate-pulse flex-shrink-0">
              <i className="fas fa-bell"></i>
            </div>
            <div>
              <h4 className="font-black text-red-800 text-sm sm:text-lg">Attention : {unpaidCurrentMonth.length} impayés !</h4>
              <p className="text-red-700 text-[10px] sm:text-sm font-medium">Certains propriétaires n'ont pas encore réglé ce mois-ci.</p>
            </div>
          </div>
          <Link to="/reminders" className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 transition-all text-center uppercase tracking-widest">Relancer</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <StatCard title="Total Encaissé" value={`${totalCollected.toLocaleString()} DH`} icon="fa-wallet" color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Total Dépenses" value={`${totalExpenses.toLocaleString()} DH`} icon="fa-money-bill-transfer" color="bg-red-100 text-red-600" />
        <StatCard title="Solde Actuel" value={`${balance.toLocaleString()} DH`} icon="fa-scale-balanced" color="bg-green-100 text-green-600" />
        <StatCard title="Impayés (Mois)" value={unpaidCurrentMonth.length} icon="fa-exclamation-circle" color="bg-red-50 text-red-500" />
        <StatCard title="Recouvrement" value={`${collectionRate.toFixed(1)} %`} icon="fa-percent" color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotisations Apparts</p>
                 <p className="text-xl sm:text-2xl font-black text-slate-800">{apartmentRevenue.toLocaleString()} DH</p>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenus des Biens</p>
                 <p className="text-xl sm:text-2xl font-black text-indigo-600">{assetRevenue.toLocaleString()} DH</p>
              </div>
           </div>

          <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-sm font-black mb-6 text-slate-800 uppercase tracking-widest">Répartition des Dépenses</h3>
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 h-full">
            <h3 className="text-sm font-black mb-6 text-slate-800 uppercase tracking-widest">Dernières Dépenses</h3>
            <div className="space-y-3">
              {expenses.length > 0 ? (
                expenses.slice(-8).reverse().map((expense) => (
                  <div key={expense.id} className={`flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors ${expense.excludedFromReports ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0"><i className="fas fa-file-invoice"></i></div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{expense.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <p className={`text-[11px] font-black flex-shrink-0 ml-2 ${expense.excludedFromReports ? 'text-slate-300' : 'text-red-500'}`}>-{expense.amount} DH</p>
                  </div>
                ))
              ) : <p className="text-center text-slate-400 py-8 italic text-xs font-bold">Aucune dépense enregistrée.</p>}
            </div>
            {expenses.length > 0 && (
              <Link to="/expenses" className="block text-center mt-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                Voir tout l'historique
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
