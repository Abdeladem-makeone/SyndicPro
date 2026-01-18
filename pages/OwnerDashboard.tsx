
import React, { useState } from 'react';
import { Apartment, Expense, Payment, AssetPayment, ReminderLog } from '../types';
import { MONTHS } from '../constants';

interface OwnerDashboardProps {
  apartment: Apartment;
  expenses: Expense[];
  payments: Payment[];
  assetPayments: AssetPayment[];
  reminderHistory: ReminderLog[];
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ 
  apartment, expenses, payments, assetPayments, reminderHistory 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'notifications'>('finance');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Filtrage des données personnelles
  const myPayments = payments.filter(p => p.apartmentId === apartment.id && p.year === currentYear);
  const myNotifications = reminderHistory.filter(r => r.apartmentId === apartment.id);

  // Calculs financiers globaux pour la copro (transparence)
  const totalAptRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalAssetRevenue = assetPayments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.filter(e => !e.excludedFromReports).reduce((s, e) => s + e.amount, 0);
  const currentBalance = (totalAptRevenue + totalAssetRevenue) - totalExpenses;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Statistique - Style Premium */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group border border-slate-800">
         <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
         
         <div className="relative z-10">
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-3">Situation de la Trésorerie</p>
            <h2 className="text-5xl font-black tracking-tighter flex items-baseline gap-2">
              {currentBalance.toLocaleString()} <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">MAD</span>
            </h2>
            <p className="text-xs mt-4 text-slate-400 font-medium max-w-xs">Garantie de transparence : visualisez en temps réel l'état des fonds collectés pour votre résidence.</p>
         </div>
         
         <div className="relative z-10 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md max-w-sm">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs"><i className="fas fa-shield-check"></i></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">Contrôle de Gestion</p>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Chaque dépense saisie par le syndic est archivée publiquement pour garantir une gestion intègre et partagée.</p>
         </div>
      </div>

      {/* Navigation Interne Elégante */}
      <div className="flex bg-slate-200/40 p-1.5 rounded-2xl border border-slate-200 self-start">
         <button onClick={() => setActiveSubTab('finance')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'finance' ? 'bg-teal-700 text-white shadow-lg' : 'text-slate-500 hover:text-teal-700'}`}>
           <i className="fas fa-wallet mr-2"></i> Mes Cotisations
         </button>
         <button onClick={() => setActiveSubTab('notifications')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'notifications' ? 'bg-teal-700 text-white shadow-lg' : 'text-slate-500 hover:text-teal-700'}`}>
           <i className="fas fa-history mr-2"></i> Journal Syndic
         </button>
      </div>

      {activeSubTab === 'finance' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           {/* Calendrier de paiement personnel */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-wider">État des versements {currentYear}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Suivi mensuel de votre appartement</p>
                 </div>
                 <div className="bg-slate-50 px-8 py-5 rounded-3xl border border-slate-100 text-center sm:text-right shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total versé cette année</p>
                    <p className="text-2xl font-black text-teal-700">{myPayments.reduce((s,p) => s+p.amount,0).toLocaleString()} <span className="text-sm">DH</span></p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {MONTHS.map((month, idx) => {
                    const isPaid = myPayments.some(p => p.month === idx);
                    const isFuture = idx > currentMonth;
                    return (
                       <div key={month} className={`p-6 rounded-[2rem] border transition-all duration-300 group hover:-translate-y-1 ${
                          isPaid ? 'bg-teal-50 border-teal-100 shadow-teal-50/50' : 
                          isFuture ? 'bg-slate-50 border-slate-100 opacity-40 grayscale' : 'bg-rose-50 border-rose-100'
                       }`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">{month}</p>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm mx-auto shadow-md transition-transform group-hover:scale-110 ${
                             isPaid ? 'bg-teal-600 text-white shadow-teal-200' : 
                             isFuture ? 'bg-slate-200 text-slate-400' : 'bg-rose-500 text-white shadow-rose-200 animate-pulse'
                          }`}>
                             <i className={`fas ${isPaid ? 'fa-check' : isFuture ? 'fa-clock' : 'fa-triangle-exclamation'}`}></i>
                          </div>
                          <p className={`text-[9px] font-black uppercase tracking-widest text-center mt-4 ${isPaid ? 'text-teal-700' : isFuture ? 'text-slate-400' : 'text-rose-600'}`}>
                             {isPaid ? 'Validé' : isFuture ? 'À venir' : 'Impayé'}
                          </p>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Journal des dépenses copro - Style Epuré */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-xs"><i className="fas fa-list-ul"></i></div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Registre des sorties de caisse</h3>
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border px-3 py-1.5 rounded-full">Derniers 15 mouvements</span>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b">
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date d'opération</th>
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description de la dépense</th>
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Montant Débité</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {expenses.filter(e => !e.excludedFromReports).slice().reverse().slice(0, 15).map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                             <td className="px-8 py-6 text-xs text-slate-500 font-medium">{new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}</td>
                             <td className="px-8 py-6">
                                <p className="font-bold text-slate-800 text-sm group-hover:text-teal-700 transition-colors">{e.description}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{e.category}</p>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right font-black text-slate-800 text-sm">-{e.amount.toLocaleString()} <span className="text-[10px] text-slate-400">DH</span></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-slate-800"><i className="fas fa-bell"></i></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Archives des Communications</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Historique des relances et informations officielles</p>
                 </div>
              </div>

              <div className="space-y-4">
                 {myNotifications.length > 0 ? myNotifications.slice().reverse().map(note => (
                    <div key={note.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 group hover:bg-white hover:border-teal-100 hover:shadow-lg hover:shadow-teal-50 transition-all cursor-default">
                       <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm group-hover:rotate-6 transition-transform">
                          <i className={`fas ${note.type === 'simple' ? 'fa-comment-sms' : 'fa-file-invoice-dollar'}`}></i>
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-slate-800">
                             {note.type === 'simple' ? 'Rappel de Cotisation Mensuelle' : 'État de Compte Détaillé'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-calendar-alt text-teal-500"></i>
                                {new Date(note.date).toLocaleString('fr-FR')}
                             </p>
                             <span className="text-[8px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">Envoi WhatsApp</span>
                          </div>
                       </div>
                       <div className="px-5 py-2 bg-teal-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-teal-100">Délivré</div>
                    </div>
                 )) : (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                          <i className="fas fa-envelope-open text-3xl"></i>
                       </div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aucune notification archivée pour cet appartement.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
