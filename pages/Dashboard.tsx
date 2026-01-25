import React, { useEffect, useRef } from 'react';
import StatCard from '../components/StatCard';
import { Apartment, Expense, Payment, BuildingInfo, AssetPayment } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import anime from 'animejs';

interface DashboardProps {
  apartments: Apartment[];
  expenses: Expense[];
  payments: Payment[];
  assetPayments?: AssetPayment[];
  buildingInfo: BuildingInfo;
}

const Dashboard: React.FC<DashboardProps> = ({ apartments, expenses, payments, assetPayments = [], buildingInfo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    // Animation d'entrée des StatCards (Stagger)
    anime({
      targets: '.stat-card-anim',
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      easing: 'easeOutElastic(1, .8)',
      duration: 1200
    });

    // Animation d'entrée des blocs de contenu principaux
    anime({
      targets: '.content-fade-up',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: 500,
      easing: 'easeOutQuart',
      duration: 800
    });

    // Animation du compteur pour le solde actuel (Exemple)
    const counterObj = { value: 0 };
    anime({
      targets: counterObj,
      value: balance,
      round: 1,
      easing: 'easeOutExpo',
      duration: 2000,
      update: () => {
        const el = document.getElementById('balance-counter');
        if (el) el.innerHTML = counterObj.value.toLocaleString() + ' DH';
      }
    });

  }, [balance]);

  return (
    <div ref={containerRef} className="space-y-8 pb-16 w-full min-w-0">
      {showAutoReminder && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h4 className="font-black text-red-900 text-sm tracking-tight">Impayés détectés ({unpaidCurrentMonth.length})</h4>
              <p className="text-red-700 text-[10px] font-medium opacity-80 uppercase tracking-widest">Relances recommandées</p>
            </div>
          </div>
          <Link to="/reminders" className="w-full md:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg font-black text-[10px] shadow-md hover:bg-red-700 transition-all text-center uppercase tracking-widest">
             Actions
          </Link>
        </div>
      )}

      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="stat-card-anim opacity-0"><StatCard title="Total Encaissé" value={`${totalCollected.toLocaleString()} DH`} icon="fa-sack-dollar" color="bg-indigo-50 text-indigo-600" /></div>
        <div className="stat-card-anim opacity-0"><StatCard title="Total Dépenses" value={`${totalExpenses.toLocaleString()} DH`} icon="fa-file-invoice-dollar" color="bg-rose-50 text-rose-600" /></div>
        <div className="stat-card-anim opacity-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-5 group hover:shadow-md transition-all ring-2 ring-indigo-50">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110">
                <i className="fas fa-vault"></i>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Solde Actuel</p>
                <h4 id="balance-counter" className="text-lg font-black text-slate-800 tracking-tight">0 DH</h4>
             </div>
          </div>
        </div>
        <div className="stat-card-anim opacity-0"><StatCard title="Alertes Impayés" value={unpaidCurrentMonth.length} icon="fa-user-clock" color="bg-amber-50 text-amber-600" /></div>
        <div className="stat-card-anim opacity-0"><StatCard title="Recouvrement" value={`${collectionRate.toFixed(1)}%`} icon="fa-chart-pie" color="bg-blue-50 text-blue-600" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 content-fade-up opacity-0">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                 <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-users text-indigo-500 text-xs"></i>
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cotisations Résidents</h5>
                 </div>
                 <p className="text-2xl font-black text-slate-800">{apartmentRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">DH</span></p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                 <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-tower-broadcast text-emerald-500 text-xs"></i>
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenus Biens</h5>
                 </div>
                 <p className="text-2xl font-black text-emerald-600">{assetRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">DH</span></p>
              </div>
           </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Répartition Budgétaire</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Analyse des flux réels par catégorie</p>
               </div>
               <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400"><i className="fas fa-chart-column"></i></div>
            </div>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" animationBegin={800} animationDuration={1500}>
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full content-fade-up opacity-0" style={{ transitionDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Activités Récentes</h3>
               <Link to="/expenses" className="text-[8px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Historique</Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[500px]">
              {expenses.length > 0 ? (
                [...expenses].slice(-12).reverse().map((expense, idx) => (
                  <div key={expense.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all ${expense.excludedFromReports ? 'opacity-40 grayscale' : ''}`}
                    style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 text-xs shadow-sm">
                        <i className="fas fa-receipt"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{expense.description}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <p className={`text-[10px] font-black flex-shrink-0 ml-4 ${expense.excludedFromReports ? 'text-slate-300 line-through' : 'text-rose-500'}`}>-{expense.amount.toLocaleString()} DH</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-20">
                   <i className="fas fa-inbox text-2xl mb-2"></i>
                   <p className="text-[9px] font-black uppercase tracking-widest">Aucune donnée</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;