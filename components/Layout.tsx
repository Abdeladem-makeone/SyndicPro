
import { Link, useLocation } from 'react-router-dom';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentUser: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, currentUser }) => {
  const location = useLocation();

  const navItems = [
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <i className="fas fa-city"></i> SyndicPro
          </h1>
          <p className="text-indigo-300 text-xs mt-1 italic">Gestion de Copropriété</p>
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-6 py-3.5 transition-colors ${location.pathname === item.path ? 'bg-indigo-800 border-l-4 border-white' : 'hover:bg-indigo-800/50 text-indigo-100'}`}>
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center"><i className="fas fa-user text-xs"></i></div>
            <p className="text-sm font-semibold truncate">{currentUser}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-300 hover:bg-red-900/40 hover:text-red-100 transition-all text-xs font-bold">
            <i className="fas fa-sign-out-alt"></i>Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1">
             <h2 className="text-xl font-bold text-slate-800">{navItems.find(i => i.path === location.pathname)?.label || 'Gestion'}</h2>
          </div>
          <p className="text-xs text-slate-500 font-bold hidden sm:block uppercase tracking-wider">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </header>
        <div className="p-8 overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
