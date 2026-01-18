
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
    <div className="space-y-10 pb-16 w-full min-w-0">
      {showAutoReminder && (
        <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-[2.5rem] shadow-xl shadow-red-100/50 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center text-2xl animate-pulse flex-shrink-0">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h4 className="font-black text-red-900 text-xl tracking-tight">Impayés détectés ({unpaidCurrentMonth.length} appartements)</h4>
              <p className="text-red-700 text-sm font-medium opacity-80">La date limite de paiement est dépassée pour ce mois-ci.</p>
            </div>
          </div>
          <Link to="/reminders" className="w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all text-center uppercase tracking-[0.2em]">
             Lancer les relances
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Total Encaissé" value={`${totalCollected.toLocaleString()} DH`} icon="fa-sack-dollar" color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Total Dépenses" value={`${totalExpenses.toLocaleString()} DH`} icon="fa-file-invoice-dollar" color="bg-rose-100 text-rose-600" />
        <StatCard title="Solde Actuel" value={`${balance.toLocaleString()} DH`} icon="fa-vault" color="bg-emerald-100 text-emerald-600" />
        <StatCard title="Alertes Impayés" value={unpaidCurrentMonth.length} icon="fa-user-clock" color="bg-amber-100 text-amber-600" />
        <StatCard title="Recouvrement" value={`${collectionRate.toFixed(1)}%`} icon="fa-chart-pie" color="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs"><i className="fas fa-users"></i></div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cotisations Résidents</h5>
                 </div>
                 <p className="text-3xl font-black text-slate-800 tracking-tight">{apartmentRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">DH</span></p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs"><i className="fas fa-tower-broadcast"></i></div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenus Locatifs/Biens</h5>
                 </div>
                 <p className="text-3xl font-black text-emerald-600 tracking-tight">{assetRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">DH</span></p>
              </div>
           </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Répartition Budgétaire</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">Analyse des flux de dépenses par catégorie</p>
               </div>
               <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-chart-column"></i></div>
            </div>
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" animationBegin={0} animationDuration={1500}>
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px 24px' }} 
                    itemStyle={{ fontWeight: 'black', fontSize: '14px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Flux Récent</h3>
               <Link to="/expenses" className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">Voir tout</Link>
            </div>
            <div className="space-y-4 flex-1">
              {expenses.length > 0 ? (
                expenses.slice(-10).reverse().map((expense) => (
                  <div key={expense.id} className={`group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all ${expense.excludedFromReports ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0 group-hover:bg-white group-hover:text-indigo-500 transition-colors shadow-sm">
                        <i className="fas fa-receipt"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate leading-tight mb-0.5">{expense.description}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                       <p className={`text-xs font-black ${expense.excludedFromReports ? 'text-slate-300 line-through' : 'text-rose-500'}`}>-{expense.amount.toLocaleString()} <span className="text-[10px]">DH</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                   <i className="fas fa-folder-open text-4xl mb-4"></i>
                   <p className="text-xs font-black uppercase tracking-widest">Aucune activité</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
