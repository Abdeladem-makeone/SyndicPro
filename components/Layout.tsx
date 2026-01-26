
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import anime from 'animejs';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: string;
  role: 'admin' | 'owner';
  language?: 'fr' | 'ar';
  onLanguageToggle?: (lang: 'fr' | 'ar') => void;
  badges?: {
    owners?: number;
    followup?: number;
  };
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  currentUser, 
  role, 
  language = 'fr', 
  onLanguageToggle,
  badges 
}) => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isAdmin = role === 'admin';
  const isAr = language === 'ar';

  useEffect(() => {
    (anime as any)({
      targets: '.sidebar-item',
      translateX: isAr ? [20, 0] : [-20, 0],
      opacity: [0, 1],
      delay: anime.stagger(50),
      easing: 'easeOutExpo'
    });
  }, [isAdmin, isAr]);

  const translations = {
    fr: {
      dashboard: 'Mon Dashboard',
      apartments: 'Parc Immobilier',
      payments: 'Finances & Cotisations',
      expenses: 'Registre des Charges',
      followup: 'Réclamations & Projets',
      owners: 'Annuaire',
      profile: 'Mon Profil',
      reports: 'Rapports PDF',
      documents: 'Fichiers Documents',
      setup: 'Paramètres',
      logout: 'Déconnexion',
      langLabel: 'العربية',
      search: 'Rechercher...'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      apartments: 'تسيير الشقق',
      payments: 'المالية والمساهمات',
      expenses: 'سجل المصاريف',
      followup: 'الشكايات والمشاريع',
      owners: 'سجل الملاك',
      profile: 'ملفي الشخصي',
      reports: 'التقارير',
      documents: 'ملف الوثائق',
      setup: 'الإعدادات',
      logout: 'خروج',
      langLabel: 'Français',
      search: 'بحث...'
    }
  };

  const t = translations[language];

  const navItems = isAdmin ? [
    { path: '/', label: t.dashboard, icon: 'fa-th-large' },
    { path: '/apartments', label: t.apartments, icon: 'fa-building' },
    { path: '/payments', label: t.payments, icon: 'fa-chart-line' },
    { path: '/expenses', label: t.expenses, icon: 'fa-receipt' },
    { path: '/followup', label: t.followup, icon: 'fa-triangle-exclamation' },
    { path: '/owners', label: t.owners, icon: 'fa-id-card', badge: badges?.owners },
    { path: '/reports', label: t.reports, icon: 'fa-file-invoice' },
    { path: '/documents', label: t.documents, icon: 'fa-folder' },
    { path: '/setup', label: t.setup, icon: 'fa-cog' },
  ] : [
    { path: '/', label: t.dashboard, icon: 'fa-house-user' },
    { path: '/followup', label: t.followup, icon: 'fa-triangle-exclamation' },
    { path: '/profile', label: t.profile, icon: 'fa-user-circle' },
  ];

  return (
    <div className={`flex min-h-screen bg-slate-50 ${isAr ? 'flex-row-reverse' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-x border-slate-100 flex flex-col sticky top-0 h-screen z-50 no-print">
         <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <i className="fas fa-city"></i>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">SyndicPro</h1>
         </div>
         
         <nav className="flex-1 px-6 space-y-1 overflow-y-auto no-scrollbar pb-10">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`sidebar-item flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  location.pathname === item.path 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'hover:bg-slate-50 text-slate-500'
                }`}
              >
                <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <i className={`fas ${item.icon} w-5 text-center text-sm ${location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}></i>
                  <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${location.pathname === item.path ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
         </nav>

         <div className="p-6 mt-auto">
            {!isAdmin && (
              <div className="bg-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden group mb-4">
                 <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl transform rotate-12 group-hover:scale-110 transition-transform"><i className="fas fa-shield-halved"></i></div>
                 <h4 className="font-black text-sm mb-2 relative z-10">{isAr ? 'مساحة آمنة' : 'Espace Sécurisé'}</h4>
                 <p className="text-[10px] text-emerald-100 opacity-80 leading-relaxed mb-4 relative z-10">{isAr ? 'جميع بياناتك مشفرة محليا' : 'Vos données sont protégées localement.'}</p>
                 <Link to="/profile" className="block w-full text-center py-2.5 bg-white text-emerald-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors">{t.profile}</Link>
              </div>
            )}
            <button 
              onClick={() => setShowLogoutModal(true)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 transition-colors font-bold text-sm ${isAr ? 'flex-row-reverse' : ''}`}
            >
              <i className="fas fa-power-off"></i>
              <span>{t.logout}</span>
            </button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col">
         <header className={`h-20 bg-white/80 backdrop-blur-md px-10 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 no-print ${isAr ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 w-96 ${isAr ? 'flex-row-reverse' : ''}`}>
              <i className="fas fa-search text-slate-300 text-sm"></i>
              <input type="text" placeholder={t.search} className={`bg-transparent border-none outline-none text-sm font-medium w-full text-slate-600 ${isAr ? 'text-right' : ''}`} />
            </div>
            <div className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse' : ''}`}>
              <button 
                onClick={() => onLanguageToggle?.(language === 'fr' ? 'ar' : 'fr')}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all font-black text-[10px] uppercase"
              >
                {t.langLabel.substring(0,2)}
              </button>
              <div className={`flex items-center gap-3 border-slate-100 ${isAr ? 'border-r pr-6' : 'border-l pl-6'} ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className={isAr ? 'text-left' : 'text-right'}>
                  <p className="text-sm font-black text-slate-800 leading-none mb-1">{currentUser}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{isAdmin ? 'Premium Admin' : 'Résident'}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                  {currentUser.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
         </header>
         <div className="p-10 content-animate overflow-x-hidden flex-1">
           {children}
         </div>
      </main>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl relative z-10 animate-in zoom-in duration-200 text-center border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
              <i className="fas fa-power-off"></i>
            </div>
            <h3 className="font-black text-slate-800 mb-2 uppercase tracking-tight text-xl">{t.logout} ?</h3>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => { setShowLogoutModal(false); onLogout(); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all text-xs">{isAr ? 'تأكيد' : 'Confirmer'}</button>
              <button onClick={() => setShowLogoutModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-all text-xs">{isAr ? 'إلغاء' : 'Annuler'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
