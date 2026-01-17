
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Apartments from './pages/Apartments';
import Owners from './pages/Owners';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import BuildingSetup from './pages/BuildingSetup';
import FollowUp from './pages/FollowUp';
import ReminderCenter from './pages/ReminderCenter';
import AssetsManager from './pages/AssetsManager';
import Login from './pages/Login';
import { Apartment, Expense, Payment, BuildingInfo, Project, Complaint, User, ReminderLog, BuildingAsset, AssetPayment } from './types';
import { INITIAL_EXPENSES } from './constants';
import { storage } from './utils/storage';
import { requestNotificationPermission, sendLocalNotification } from './utils/notificationUtils';
import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('syndic_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo>(() => {
    const data = storage.loadBuildingData();
    return data.building || {
      name: '', address: '', totalUnits: 0, unitsPerFloor: 1, numFloors: 1, 
      defaultMonthlyFee: 0, isConfigured: false, autoRemindersEnabled: false, 
      notificationsEnabled: false,
      reminderLanguage: 'ar', whatsappTemplate: '', whatsappDetailedTemplate: ''
    };
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => storage.loadBuildingData().apartments || []);
  const [assets, setAssets] = useState<BuildingAsset[]>(() => storage.loadAssets());
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const data = storage.loadAllYearlyData();
    return data.expenses.length > 0 ? data.expenses : INITIAL_EXPENSES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => storage.loadAllYearlyData().payments || []);
  const [assetPayments, setAssetPayments] = useState<AssetPayment[]>(() => storage.loadAllYearlyData().assetPayments || []);

  const [projects, setProjects] = useState<Project[]>(() => storage.loadOperations().projects || []);
  const [complaints, setComplaints] = useState<Complaint[]>(() => storage.loadOperations().complaints || []);
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>(() => storage.loadReminders());

  const handleLogin = (user: User) => {
    localStorage.setItem('syndic_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('syndic_session');
    setCurrentUser(null);
  };

  const handleSaveBuilding = (info: BuildingInfo, newApartments?: Apartment[]) => {
    setBuildingInfo(info);
    if (newApartments) {
      setApartments(newApartments);
    }
  };

  // SAUVEGARDE AUTOMATIQUE
  useEffect(() => {
    if (buildingInfo.isConfigured) storage.saveBuildingData(buildingInfo, apartments);
  }, [buildingInfo, apartments]);

  useEffect(() => { storage.saveAssets(assets); }, [assets]);
  useEffect(() => { storage.saveOperations(projects, complaints); }, [projects, complaints]);
  useEffect(() => { storage.saveReminders(reminderHistory); }, [reminderHistory]);

  useEffect(() => {
    const years = new Set([...payments.map(p => p.year), new Date().getFullYear()]);
    years.forEach(year => storage.saveYearlyFinance(year, payments, expenses, assetPayments));
  }, [payments, expenses, assetPayments]);

  if (!currentUser) return <Login apartments={apartments} onLogin={handleLogin} />;

  const isAdmin = currentUser.role === 'admin';

  return (
    <HashRouter>
      <Layout onLogout={handleLogout} currentUser={currentUser.username} role={currentUser.role}>
        <Routes>
          <Route path="/" element={
            isAdmin 
              ? (buildingInfo.isConfigured ? <Dashboard apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo} /> : <Navigate to="/setup" replace />)
              : <Navigate to="/followup" replace />
          } />
          
          <Route path="/followup" element={
            <FollowUp 
              apartments={apartments} 
              projects={projects} 
              complaints={complaints} 
              currentUser={currentUser}
              onAddProject={p => setProjects([...projects, p])} 
              onUpdateProject={u => setProjects(projects.map(p => p.id === u.id ? u : p))} 
              onDeleteProject={id => setProjects(projects.filter(p => p.id !== id))} 
              onAddComplaint={c => setComplaints([...complaints, c])} 
              onUpdateComplaint={u => setComplaints(complaints.map(c => c.id === u.id ? u : c))} 
              onDeleteComplaint={id => setComplaints(complaints.filter(c => c.id !== id))} 
              buildingName={buildingInfo.name} 
            />
          } />

          {!isAdmin && (
            <Route path="/cash-state" element={
              <div className="space-y-8">
                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Solde Actuel de la Copropriété</p>
                    <p className="text-4xl font-black text-indigo-600">
                       {(payments.reduce((s,p) => s+p.amount, 0) + assetPayments.reduce((s,p) => s+p.amount, 0) - expenses.filter(e => !e.excludedFromReports).reduce((s,e) => s+e.amount, 0)).toLocaleString()} DH
                    </p>
                 </div>
                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b bg-slate-50">
                       <h3 className="text-sm font-black text-slate-800 uppercase">Dernières Dépenses (Transparence)</h3>
                    </div>
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b">
                          <tr className="text-[10px] font-bold text-slate-400 uppercase">
                             <th className="px-6 py-4">Date</th>
                             <th className="px-6 py-4">Désignation</th>
                             <th className="px-6 py-4 text-right">Montant</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {expenses.filter(e => !e.excludedFromReports).slice().reverse().slice(0, 20).map(e => (
                             <tr key={e.id} className="text-sm">
                                <td className="px-6 py-4 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold">{e.description}</td>
                                <td className="px-6 py-4 text-right font-black text-red-500">-{e.amount.toLocaleString()} DH</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            } />
          )}

          {isAdmin && (
            <>
              <Route path="/assets" element={<AssetsManager assets={assets} assetPayments={assetPayments} onAddAsset={a => setAssets([...assets, a])} onUpdateAsset={ua => setAssets(assets.map(a => a.id === ua.id ? ua : a))} onDeleteAsset={id => setAssets(assets.filter(a => a.id !== id))} onAddPayment={ap => setAssetPayments([...assetPayments, ap])} onDeletePayment={pid => setAssetPayments(assetPayments.filter(p => p.id !== pid))} />} />
              <Route path="/setup" element={<BuildingSetup buildingInfo={buildingInfo} onSave={handleSaveBuilding} onImportFullDB={d => { if(d.core) { setBuildingInfo(d.core.building); setApartments(d.core.apartments); } }} fullData={storage.getFullExport()} currentApartmentsCount={apartments.length} />} />
              <Route path="/reminders" element={<ReminderCenter apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdateBuilding={setBuildingInfo} reminderHistory={reminderHistory} onAddReminderLog={l => setReminderHistory([...reminderHistory, l])} onClearHistory={() => setReminderHistory([])} />} />
              <Route path="/apartments" element={<Apartments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} onAdd={n => setApartments([...apartments, n])} onDelete={id => setApartments(apartments.filter(a => a.id !== id))} />} />
              <Route path="/owners" element={<Owners apartments={apartments} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} />} />
              <Route path="/expenses" element={<Expenses expenses={expenses} onAdd={e => setExpenses([...expenses, e])} onUpdate={u => setExpenses(expenses.map(ex => ex.id === u.id ? u : ex))} onDelete={id => setExpenses(expenses.filter(e => e.id !== id))} />} />
              <Route path="/payments" element={<Payments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onTogglePayment={(aid, m, y) => {
                const ex = payments.find(p => p.apartmentId === aid && p.month === m && p.year === y);
                if (ex) setPayments(payments.filter(p => p.id !== ex.id));
                else {
                  const apt = apartments.find(a => a.id === aid);
                  setPayments([...payments, { id: Date.now().toString(), apartmentId: aid, month: m, year: y, amount: apt?.monthlyFee || 0, paidDate: new Date().toISOString() }]);
                }
              }} />} />
              <Route path="/reports" element={<Reports apartments={apartments} expenses={expenses} payments={payments} buildingInfo={buildingInfo} />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
