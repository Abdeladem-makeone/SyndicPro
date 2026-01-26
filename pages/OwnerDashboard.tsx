
import React, { useState, useEffect } from 'react';
import { Apartment, Expense, Payment, AssetPayment, ReminderLog, BuildingInfo } from '../types';
import { MONTHS } from '../constants';
import anime from 'animejs';

interface OwnerDashboardProps {
  apartment: Apartment;
  expenses: Expense[];
  payments: Payment[];
  assetPayments: AssetPayment[];
  reminderHistory: ReminderLog[];
  buildingInfo: BuildingInfo;
  language?: 'fr' | 'ar';
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
];

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ 
  apartment, expenses, payments, assetPayments, reminderHistory, buildingInfo, language = 'fr' 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'notifications'>('finance');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const isAr = language === 'ar';

  useEffect(() => {
    // Animation staggered des cartes de mois
    (anime as any)({
      targets: '.month-card',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(40),
      easing: 'easeOutQuart'
    });

    // Animation du compteur de trésorerie
    const totalAptRevenue = payments.reduce((s, p) => s + p.amount, 0);
    const totalAssetRevenue = assetPayments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.filter(e => !e.excludedFromReports).reduce((s, e) => s + e.amount, 0);
    const balance = (totalAptRevenue + totalAssetRevenue) - totalExpenses;

    const counterObj = { value: 0 };
    (anime as any)({
      targets: counterObj,
      value: balance,
      round: 1,
      easing: 'easeOutExpo',
      duration: 2000,
      update: () => {
        const el = document.getElementById('owner-balance-counter');
        if (el) el.innerHTML = counterObj.value.toLocaleString() + ' DH';
      }
    });
  }, [payments, expenses, assetPayments]);

  const translations = {
    fr: {
      balanceTitle: 'Situation de la Trésorerie',
      balanceDesc: 'Visualisez l\'état des fonds collectés pour votre résidence.',
      transparency: 'Garantie de transparence',
      paymentsTitle: 'État des versements',
      paymentsDesc: 'Suivi mensuel de votre appartement',
      totalYear: 'Total versé cette année',
      registerTitle: 'Registre des d\u00e9penses',
      archiveTitle: 'Archives des Communications',
      noNotif: 'Aucune notification archivée.',
      statusPaid: 'Validé',
      statusWaiting: 'À venir',
      statusUnpaid: 'Impayé',
      dateLabel: 'Date d\'opération',
      descLabel: 'Description',
      amountLabel: 'Montant',
      months: MONTHS,
      overdueTitle: 'Mois en retard',
      overdueDesc: 'Vous avez des cotisations non régularisées',
      totalOverdue: 'Total restant dû',
      monthShort: 'Mois'
    },
    ar: {
      balanceTitle: 'حالة الخزينة',
      balanceDesc: 'اطلع على حالة الأموال المجموعة لإقامتكم.',
      transparency: 'ضمان الشفافية',
      paymentsTitle: 'حالة الدفعات',
      paymentsDesc: 'المتابعة الشهرية لشقتكم',
      totalYear: 'إجمالي المدفوعات لهذا العام',
      registerTitle: 'سجل المصاريف',
      archiveTitle: 'أرشيف المراسلات',
      noNotif: 'لا يوجد تنبيهات مؤرشفة.',
      statusPaid: 'مؤدى',
      statusWaiting: 'قادم',
      statusUnpaid: 'غير مؤدى',
      dateLabel: 'تاريخ العملية',
      descLabel: 'الوصف',
      amountLabel: 'المبلغ',
      months: MONTHS_AR,
      overdueTitle: 'أشهر متأخرة',
      overdueDesc: 'لديك مساهمات لم يتم تسويتها بعد',
      totalOverdue: 'إجمالي المتأخرات',
      monthShort: 'شهر'
    }
  };

  const t = translations[language];

  const myPayments = payments.filter(p => p.apartmentId === apartment.id && p.year === currentYear);
  const myNotifications = reminderHistory.filter(r => r.apartmentId === apartment.id);

  const overdueMonths = [];
  for (let m = 0; m <= currentMonth; m++) {
    if (!myPayments.some(p => p.month === m)) {
      overdueMonths.push({ index: m, name: t.months[m] });
    }
  }
  const totalOverdueAmount = overdueMonths.length * apartment.monthlyFee;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER TRESORERIE (UrbanShop Dark Mode) */}
      {buildingInfo.ownerShowBalance && (
        <div className="bg-slate-900 rounded-[3rem] p-10 sm:p-14 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl transform rotate-12 group-hover:scale-110 transition-transform"><i className="fas fa-vault"></i></div>
           <div className={`relative z-10 text-center ${isAr ? 'md:text-right' : 'md:text-left'}`}>
              <p className={`font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.balanceTitle}</p>
              <h2 id="owner-balance-counter" className="text-5xl sm:text-7xl font-black tracking-tighter">
                0 DH
              </h2>
              <p className={`mt-6 text-slate-400 font-medium max-w-xs leading-relaxed ${isAr ? 'text-lg' : 'text-xs'}`}>{t.balanceDesc}</p>
           </div>
           
           <div className="relative z-10 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md max-w-sm">
              <div className={`flex items-center gap-3 mb-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><i className="fas fa-shield-check"></i></div>
                 <p className={`font-black uppercase tracking-widest text-indigo-400 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.transparency}</p>
              </div>
              <p className={`text-slate-300 font-medium leading-relaxed ${isAr ? 'text-lg' : 'text-[11px]'}`}>{isAr ? 'نظام تسيير شفاف يضمن حقوق جميع الملاك عبر تتبع مباشر لجميع العمليات المالية.' : 'Un système de gestion transparent qui garantit les droits de tous les propriétaires via un suivi direct.'}</p>
           </div>
        </div>
      )}

      {/* ALERTES RETARD */}
      {overdueMonths.length > 0 && activeSubTab === 'finance' && (
        <div className={`bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm animate-in slide-in-from-top-4 duration-500 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-8 text-center ${isAr ? 'md:text-right' : 'md:text-left'} ${isAr ? 'flex-row-reverse' : ''}`}>
            <div className="w-16 h-16 bg-rose-600 text-white rounded-[1.25rem] flex items-center justify-center text-2xl shadow-xl shadow-rose-200 animate-pulse">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className={`font-black text-rose-900 ${isAr ? 'text-2xl' : 'text-xl'}`}>{t.overdueTitle}</h3>
              <p className={`font-bold text-rose-500 uppercase tracking-widest mt-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.overdueDesc}</p>
              <div className={`flex flex-wrap gap-2 mt-4 justify-center md:justify-start ${isAr ? 'flex-row-reverse' : ''}`}>
                {overdueMonths.map(m => (
                  <span key={m.index} className="px-4 py-1.5 bg-rose-100 text-rose-800 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-200">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white px-10 py-8 rounded-[2rem] border border-rose-100 text-center shadow-sm min-w-[240px]">
             <p className={`font-black text-rose-400 uppercase tracking-widest mb-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.totalOverdue}</p>
             <p className="text-4xl font-black text-rose-600">{totalOverdueAmount.toLocaleString()} <span className="text-sm font-bold uppercase">DH</span></p>
          </div>
        </div>
      )}

      {/* TABS (UrbanShop Style) */}
      <div className={`flex gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit ${isAr ? 'flex-row-reverse' : ''}`}>
         <button onClick={() => setActiveSubTab('finance')} className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeSubTab === 'finance' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[11px]'}`}>
           {t.paymentsTitle}
         </button>
         <button onClick={() => setActiveSubTab('notifications')} className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeSubTab === 'notifications' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[11px]'}`}>
           {t.archiveTitle}
         </button>
      </div>

      {activeSubTab === 'finance' && (
        <div className="space-y-10">
           <div className="bg-white rounded-[3rem] p-10 sm:p-12 border border-slate-100 shadow-sm">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-8 ${isAr ? 'flex-row-reverse' : ''}`}>
                 <div className={isAr ? 'text-right' : 'text-left'}>
                    <h3 className={`font-black text-slate-800 tracking-tight uppercase ${isAr ? 'text-3xl' : 'text-2xl'}`}>{t.paymentsTitle} {currentYear}</h3>
                    <p className={`text-slate-400 font-bold uppercase mt-1 tracking-widest ${isAr ? 'text-sm' : 'text-xs'}`}>{t.paymentsDesc}</p>
                 </div>
                 <div className="bg-indigo-50 px-10 py-8 rounded-[2rem] border border-indigo-100 text-center shadow-inner min-w-[280px]">
                    <p className={`font-black text-indigo-400 uppercase tracking-widest mb-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.totalYear}</p>
                    <p className="text-4xl font-black text-indigo-600">{myPayments.reduce((s,p) => s+p.amount,0).toLocaleString()} <span className="text-sm font-bold uppercase opacity-40">DH</span></p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                 {t.months.map((month, idx) => {
                    const isPaid = myPayments.some(p => p.month === idx);
                    const isFuture = idx > currentMonth;
                    return (
                       <div key={month} className={`month-card opacity-0 p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
                          isPaid ? 'bg-emerald-50 border-emerald-100' : 
                          isFuture ? 'bg-slate-50 border-slate-50 opacity-40' : 'bg-rose-50 border-rose-100'
                       }`}>
                          <p className={`font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-4 ${isAr ? 'text-base' : 'text-[10px]'}`}>{month}</p>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm ${
                             isPaid ? 'bg-emerald-600 text-white' : 
                             isFuture ? 'bg-slate-200 text-slate-400' : 'bg-rose-600 text-white'
                          }`}>
                             <i className={`fas ${isPaid ? 'fa-check' : isFuture ? 'fa-lock' : 'fa-clock'}`}></i>
                          </div>
                          <p className={`font-black uppercase text-center mt-5 tracking-widest ${isPaid ? 'text-emerald-700' : isFuture ? 'text-slate-400' : 'text-rose-700'} ${isAr ? 'text-sm' : 'text-[9px]'}`}>
                             {isPaid ? t.statusPaid : isFuture ? t.statusWaiting : t.statusUnpaid}
                          </p>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* REGISTRE DES CHARGES (Style UrbanShop List) */}
           {buildingInfo.ownerShowExpenseRegister && (
             <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className={`p-8 border-b bg-slate-50/50 flex justify-between items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                   <h3 className={`font-black text-slate-800 uppercase tracking-[0.2em] ${isAr ? 'text-base' : 'text-xs'}`}>{t.registerTitle}</h3>
                   <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-lg border uppercase">10 derniers flux</span>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className={`bg-slate-50/30 border-b ${isAr ? 'flex-row-reverse' : ''}`}>
                            <th className={`px-8 py-6 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-right text-sm' : 'text-left text-[10px]'}`}>{t.dateLabel}</th>
                            <th className={`px-8 py-6 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-right text-sm' : 'text-left text-[10px]'}`}>{t.descLabel}</th>
                            <th className={`px-8 py-6 font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-left text-sm' : 'text-right text-[10px]'}`}>{t.amountLabel}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {expenses.filter(e => !e.excludedFromReports).slice().reverse().slice(0, 10).map((e, idx) => (
                            <tr key={e.id} className="hover:bg-slate-50/80 transition-colors group">
                               <td className={`px-8 py-6 text-slate-400 font-bold whitespace-nowrap ${isAr ? 'text-lg' : 'text-xs'}`}>{new Date(e.date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')}</td>
                               <td className="px-8 py-6">
                                  <p className={`font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors ${isAr ? 'text-xl' : 'text-sm'}`}>{e.description}</p>
                                  <span className={`inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase tracking-widest mt-2 ${isAr ? 'text-xs' : 'text-[9px]'}`}>{e.category}</span>
                               </td>
                               <td className={`px-8 py-6 font-black text-slate-800 whitespace-nowrap ${isAr ? 'text-left text-xl' : 'text-right text-sm'}`}>-{e.amount.toLocaleString()} <span className="opacity-40">DH</span></td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>
      )}

      {activeSubTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           {myNotifications.length > 0 ? myNotifications.slice().reverse().map(note => (
              <div key={note.id} className={`p-8 bg-white rounded-[2.5rem] border border-slate-100 flex items-center gap-8 shadow-sm hover:shadow-lg transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
                 <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner"><i className="fab fa-whatsapp"></i></div>
                 <div className={`flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
                    <p className={`font-black text-slate-800 leading-tight ${isAr ? 'text-2xl' : 'text-base'}`}>{note.type === 'simple' ? (isAr ? 'تذكير قياسي' : 'Rappel standard') : (isAr ? 'تفاصيل المتأخرات' : 'Détail impayés')}</p>
                    <p className={`font-bold text-slate-400 uppercase tracking-widest mt-2 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{new Date(note.date).toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-FR')}</p>
                 </div>
                 <span className={`px-5 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black uppercase tracking-widest ${isAr ? 'text-xs' : 'text-[10px]'}`}>CERTIFIÉ</span>
              </div>
           )) : (
              <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                 <i className="fas fa-inbox text-5xl mb-6"></i>
                 <p className={`font-black text-slate-400 uppercase tracking-[0.3em] ${isAr ? 'text-xl' : 'text-sm'}`}>{t.noNotif}</p>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
