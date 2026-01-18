
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: string;
  role: 'admin' | 'owner';
  badges?: {
    owners?: number;
    followup?: number;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, currentUser, role, badges = {} }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = role === 'admin';

  const theme = isAdmin 
    ? {
        sidebar: 'bg-indigo-950',
        navActive: 'bg-indigo-700 text-white shadow-lg',
        navHover: 'hover:bg-white/5 text-indigo-200',
        icon: 'text-indigo-400',
        header: 'text-indigo-400',
        badge: 'bg-red-500'
      }
    : {
        sidebar: 'bg-slate-950',
        navActive: 'bg-teal-700 text-white shadow-lg',
        navHover: 'hover:bg-white/5 text-slate-300',
        icon: 'text-teal-400',
        header: 'text-teal-400',
        badge: 'bg-amber-500'
      };

  const SYNDIC_GROUPS = [
    {
      title: 'Analyse',
      items: [{ path: '/', label: 'Tableau de bord', icon: 'fa-chart-pie' }]
    },
    {
      title: 'Patrimoine',
      items: [
        { path: '/setup', label: 'Configuration', icon: 'fa-gears' },
        { path: '/apartments', label: 'Appartements', icon: 'fa-building-user' },
        { path: '/owners', label: 'Annuaire Propriétaires', icon: 'fa-address-book', badgeKey: 'owners' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { path: '/payments', label: 'Suivi Cotisations', icon: 'fa-money-check-dollar' },
        { path: '/assets', label: 'Biens & Revenus', icon: 'fa-vault' },
        { path: '/expenses', label: 'Journal Dépenses', icon: 'fa-receipt' },
        { path: '/reports', label: 'Bilans & Rapports', icon: 'fa-file-contract' },
      ]
    },
    {
      title: 'Vie de Copropriété',
      items: [
        { path: '/reminders', label: 'Centre de Rappel', icon: 'fa-comment-sms' },
        { path: '/followup', label: 'Suivi & Projets', icon: 'fa-list-check', badgeKey: 'followup' },
      ]
    }
  ];

  const OWNER_ITEMS = [
    { path: '/followup', label: 'Initiative et réclamation', icon: 'fa-house-chimney-window' },
    { path: '/cash-state', label: 'Transparence Financière', icon: 'fa-magnifying-glass-chart' },
    { path: '/profile', label: 'Mon Profil & Appartement', icon: 'fa-user-gear' },
  ];

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* SIDEBAR DESKTOP */}
      <aside className={`w-72 ${theme.sidebar} text-white flex-shrink-0 hidden xl:flex flex-col sticky top-0 h-screen shadow-2xl z-[100]`}>
        <div className="p-8 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20">
              <i className={`fas fa-city ${isAdmin ? 'text-white' : 'text-teal-400'}`}></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">SyndicPro</h1>
              <p className={`text-[9px] font-black ${isAdmin ? 'text-indigo-300' : 'text-teal-400'} uppercase tracking-widest mt-1`}>Manager v4.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-8">
          {isAdmin ? (
            SYNDIC_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className={`px-4 text-[9px] font-black ${theme.header} uppercase tracking-[0.2em] opacity-70`}>{group.title}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${location.pathname === item.path ? theme.navActive : theme.navHover}`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fas ${item.icon} w-5 text-center text-sm ${location.pathname === item.path ? 'text-white' : theme.icon}`}></i>
                        <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                      </div>
                      {item.badgeKey && (badges as any)[item.badgeKey] > 0 && (
                        <span className={`${theme.badge} text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse`}>
                          {(badges as any)[item.badgeKey]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <h3 className={`px-4 text-[9px] font-black ${theme.header} uppercase tracking-[0.2em] opacity-70`}>Mon Espace</h3>
              <div className="space-y-1">
                {OWNER_ITEMS.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? theme.navActive : theme.navHover}`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center text-sm ${location.pathname === item.path ? 'text-white' : theme.icon}`}></i>
                    <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className={`w-9 h-9 rounded-xl ${isAdmin ? 'bg-indigo-600' : 'bg-teal-700'} flex items-center justify-center shadow-inner flex-shrink-0`}>
              <i className="fas fa-user-shield text-white text-sm"></i>
            </div>
            <div className="min-w-0">
              <p className={`text-[9px] font-black ${isAdmin ? 'text-indigo-400' : 'text-teal-400'} uppercase leading-none mb-1`}>Connecté</p>
              <p className="text-xs font-black truncate text-white">{currentUser}</p>
            </div>
          </div>
          <button 
            id="logout-button-desktop"
            onClick={handleLogoutClick}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-red-300 bg-red-900/10 border border-red-900/20 hover:bg-red-900/60 hover:text-red-100 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer relative z-[300]"
          >
            <i className="fas fa-power-off"></i> Déconnexion
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] xl:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 bottom-0 w-80 ${theme.sidebar} text-white z-[120] xl:hidden flex flex-col transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl border border-white/20">
              <i className={`fas fa-city ${isAdmin ? 'text-white' : 'text-teal-400'}`}></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">SyndicPro</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-8">
          {isAdmin ? (
            SYNDIC_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className={`px-4 text-[9px] font-black ${theme.header} uppercase tracking-[0.2em] opacity-70`}>{group.title}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link key={item.path} to={item.path} className={`flex items-center justify-between px-4 py-3 rounded-2xl ${location.pathname === item.path ? theme.navActive : theme.navHover}`}>
                      <div className="flex items-center gap-3">
                        <i className={`fas ${item.icon} w-5 text-center text-sm ${location.pathname === item.path ? 'text-white' : theme.icon}`}></i>
                        <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <h3 className={`px-4 text-[9px] font-black ${theme.header} uppercase tracking-[0.2em] opacity-70`}>Mon Espace</h3>
              <div className="space-y-1">
                {OWNER_ITEMS.map((item) => (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${location.pathname === item.path ? theme.navActive : theme.navHover}`}>
                    <i className={`fas ${item.icon} w-5 text-center text-sm ${location.pathname === item.path ? 'text-white' : theme.icon}`}></i>
                    <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4 bg-black/10 flex-shrink-0">
          <button 
            id="logout-button-mobile"
            onClick={handleLogoutClick}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-red-300 bg-red-900/10 border border-red-900/20 hover:bg-red-900/60 hover:text-red-100 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer z-[300] relative"
          >
            <i className="fas fa-power-off"></i> Déconnexion
          </button>
        </div>
      </aside>

      {/* MODALE DE DÉCONNEXION PERSONNALISÉE */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 sm:p-10 shadow-2xl relative z-10 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6">
              <i className="fas fa-power-off"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2 uppercase tracking-tight">Déconnexion</h3>
            <p className="text-sm text-slate-500 text-center mb-8 font-medium">Voulez-vous vraiment fermer votre session ? Vos données sont automatiquement sauvegardées.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmLogout}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
              >
                Confirmer la déconnexion
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full relative">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <i className="fas fa-bars-staggered"></i>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Application</h2>
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {isAdmin ? 'Espace Administration' : 'Espace Propriétaire'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-slate-100/50 px-5 py-2.5 rounded-2xl border border-slate-200/50">
              <i className={`fas fa-calendar-day ${isAdmin ? 'text-indigo-500' : 'text-teal-600'} text-xs`}></i>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 overflow-y-auto h-[calc(100vh-80px)] no-scrollbar bg-slate-50">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-700 slide-in-from-bottom-2">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
