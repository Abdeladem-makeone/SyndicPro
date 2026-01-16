
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

  // SAUVEGARDE AUTOMATIQUE SEGMENTÉE
  useEffect(() => {
    storage.saveBuildingData(buildingInfo, apartments);
  }, [buildingInfo, apartments]);

  useEffect(() => {
    storage.saveAssets(assets);
  }, [assets]);

  useEffect(() => {
    storage.saveOperations(projects, complaints);
  }, [projects, complaints]);

  useEffect(() => {
    storage.saveReminders(reminderHistory);
  }, [reminderHistory]);

  useEffect(() => {
    const years = new Set([
      ...payments.map(p => p.year),
      ...assetPayments.map(p => p.year),
      ...expenses.map(e => new Date(e.date).getFullYear()),
      new Date().getFullYear()
    ]);
    years.forEach(year => storage.saveYearlyFinance(year, payments, expenses, assetPayments));
  }, [payments, expenses, assetPayments]);

  if (!currentUser) return <Login onLogin={(u, p) => {
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({ id: '1', username: 'admin', role: 'admin' });
      return true;
    }
    return false;
  }} />;

  return (
    <HashRouter>
      <Layout onLogout={() => setCurrentUser(null)} currentUser={currentUser.username}>
        <Routes>
          {/* Si l'immeuble n'est pas configuré, on force la page Setup */}
          <Route path="/" element={buildingInfo.isConfigured ? <Dashboard apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo} /> : <Navigate to="/setup" replace />} />
          
          <Route path="/assets" element={<AssetsManager assets={assets} assetPayments={assetPayments} onAddAsset={a => setAssets([...assets, a])} onUpdateAsset={ua => setAssets(assets.map(a => a.id === ua.id ? ua : a))} onDeleteAsset={id => setAssets(assets.filter(a => a.id !== id))} onAddPayment={ap => setAssetPayments([...assetPayments, ap])} onDeletePayment={pid => setAssetPayments(assetPayments.filter(p => p.id !== pid))} />} />
          
          <Route path="/setup" element={<BuildingSetup buildingInfo={buildingInfo} onSave={info => setBuildingInfo(info)} onImportFullDB={data => {
            if (data.core) { setBuildingInfo(data.core.building); setApartments(data.core.apartments); }
            if (data.assets) setAssets(data.assets);
            if (data.finance) { setPayments(data.finance.payments || []); setExpenses(data.finance.expenses || []); setAssetPayments(data.finance.assetPayments || []); }
          }} fullData={storage.getFullExport()} />} />
          
          <Route path="/reminders" element={<ReminderCenter apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdateBuilding={setBuildingInfo} reminderHistory={reminderHistory} onAddReminderLog={l => setReminderHistory([...reminderHistory, l])} onClearHistory={() => setReminderHistory([])} />} />
          
          <Route path="/apartments" element={<Apartments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} onAdd={n => setApartments([...apartments, n])} onDelete={id => setApartments(apartments.filter(a => a.id !== id))} />} />
          
          <Route path="/owners" element={<Owners apartments={apartments} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} />} />
          
          <Route path="/expenses" element={<Expenses expenses={expenses} onAdd={e => setExpenses([...expenses, e])} onUpdate={u => setExpenses(expenses.map(ex => ex.id === u.id ? u : ex))} onDelete={id => setExpenses(expenses.filter(e => e.id !== id))} />} />
          
          <Route path="/payments" element={<Payments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onTogglePayment={(aptId, month, year) => {
            const existing = payments.find(p => p.apartmentId === aptId && p.month === month && p.year === year);
            if (existing) setPayments(payments.filter(p => p.id !== existing.id));
            else {
              const apt = apartments.find(a => a.id === aptId);
              setPayments([...payments, { id: Date.now().toString(), apartmentId: aptId, month, year, amount: apt?.monthlyFee || 0, paidDate: new Date().toISOString() }]);
            }
          }} />} />
          
          <Route path="/followup" element={<FollowUp apartments={apartments} projects={projects} complaints={complaints} onAddProject={p => setProjects([...projects, p])} onUpdateProject={u => setProjects(projects.map(p => p.id === u.id ? u : p))} onDeleteProject={id => setProjects(projects.filter(p => p.id !== id))} onAddComplaint={c => setComplaints([...complaints, c])} onUpdateComplaint={u => setComplaints(complaints.map(c => c.id === u.id ? u : c))} onDeleteComplaint={id => setComplaints(complaints.filter(c => c.id !== id))} buildingName={buildingInfo.name} />} />
          
          <Route path="/reports" element={<Reports apartments={apartments} expenses={expenses} payments={payments} buildingInfo={buildingInfo} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
