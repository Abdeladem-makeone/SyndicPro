
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: string;
  role: 'admin' | 'owner';
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, currentUser, role }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = role === 'admin';

  const syndicNav = [
    { path: '/', label: 'Tableau de bord', icon: 'fa-chart-line' },
    { path: '/setup', label: 'Immeuble', icon: 'fa-info-circle' },
    { path: '/assets', label: 'Biens & Revenus', icon: 'fa-vault' },
    { path: '/reminders', label: 'Centre de Rappel', icon: 'fa-bell' },
    { path: '/apartments', label: 'Appartements', icon: 'fa-building' },
    { path: '/owners', label: 'Propriétaires', icon: 'fa-users-gear' },
    { path: '/payments', label: 'Cotisations', icon: 'fa-hand-holding-dollar' },
    { path: '/expenses', label: 'Dépenses', icon: 'fa-receipt' },
    { path: '/followup', label: 'Suivi & Projets', icon: 'fa-list-check' },
    { path: '/reports', label: 'Bilans & Rapports', icon: 'fa-file-invoice-dollar' },
  ];

  const ownerNav = [
    { path: '/followup', label: 'Mon Immeuble', icon: 'fa-building-circle-check' },
    { path: '/cash-state', label: 'Trésorerie', icon: 'fa-wallet' },
  ];

  const currentNav = isAdmin ? syndicNav : ownerNav;

  const NavContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <i className="fas fa-city text-indigo-400"></i> SyndicPro
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isAdmin ? 'bg-indigo-700 text-indigo-100' : 'bg-amber-500 text-amber-950'}`}>
            {isAdmin ? 'Espace Syndic' : 'Espace Propriétaire'}
          </span>
        </div>
      </div>
      <nav className="mt-6 flex-1 overflow-y-auto no-scrollbar">
        {currentNav.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex items-center gap-3 px-6 py-4 transition-all ${location.pathname === item.path ? 'bg-indigo-800 border-l-4 border-white text-white' : 'hover:bg-indigo-800/40 text-indigo-200'}`}
          >
            <i className={`fas ${item.icon} w-5 text-sm`}></i>
            <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-6 border-t border-indigo-800 space-y-4 bg-indigo-950/40">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-700 flex items-center justify-center shadow-inner flex-shrink-0">
            <i className="fas fa-user-circle text-lg"></i>
          </div>
          <div className="min-w-0">
             <p className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">Session active</p>
             <p className="text-sm font-bold truncate text-white">{currentUser}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-300 bg-red-900/10 border border-red-900/20 hover:bg-red-900/30 hover:text-red-100 transition-all text-[10px] font-black uppercase tracking-widest">
          <i className="fas fa-sign-out-alt"></i> Quitter
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Barre latérale Desktop */}
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl z-50">
        <NavContent />
      </aside>

      {/* Barre latérale Mobile (Drawer) */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-72 bg-indigo-900 text-white z-[70] lg:hidden flex flex-col transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <NavContent />
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 text-indigo-300 hover:text-white lg:hidden"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">
              {currentNav.find(i => i.path === location.pathname)?.label || 'Accueil'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-slate-400 font-black hidden sm:block uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {!isAdmin && (
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter sm:hidden">
                Proprio
              </span>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-8 overflow-y-auto h-[calc(100vh-64px)] scroll-smooth w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
