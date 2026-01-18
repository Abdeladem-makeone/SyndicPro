
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
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProfile from './pages/OwnerProfile';
import Login from './pages/Login';
import { Apartment, Expense, Payment, BuildingInfo, Project, Complaint, User, ReminderLog, BuildingAsset, AssetPayment, ProfileRequest } from './types';
import { INITIAL_EXPENSES } from './constants';
import { storage } from './utils/storage';
import React, { useState, useEffect, useCallback } from 'react';

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
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.loadAllYearlyData().expenses.length > 0 ? storage.loadAllYearlyData().expenses : INITIAL_EXPENSES);
  const [payments, setPayments] = useState<Payment[]>(() => storage.loadAllYearlyData().payments || []);
  const [assetPayments, setAssetPayments] = useState<AssetPayment[]>(() => storage.loadAllYearlyData().assetPayments || []);
  const [projects, setProjects] = useState<Project[]>(() => storage.loadOperations().projects || []);
  const [complaints, setComplaints] = useState<Complaint[]>(() => storage.loadOperations().complaints || []);
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>(() => storage.loadReminders());
  const [profileRequests, setProfileRequests] = useState<ProfileRequest[]>(() => {
    const saved = localStorage.getItem('syndic_profile_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const performGlobalSave = useCallback(() => {
    try {
      storage.saveBuildingData(buildingInfo, apartments);
      const years = new Set([...payments.map(p => p.year), new Date().getFullYear()]);
      years.forEach(year => storage.saveYearlyFinance(year, payments, expenses, assetPayments));
      storage.saveAssets(assets);
      storage.saveOperations(projects, complaints);
      storage.saveReminders(reminderHistory);
      localStorage.setItem('syndic_profile_requests', JSON.stringify(profileRequests));
    } catch (error) {
      console.error("[STORAGE ERROR]", error);
    }
  }, [buildingInfo, apartments, payments, expenses, assetPayments, assets, projects, complaints, reminderHistory, profileRequests]);

  const handleLogin = (user: User) => {
    localStorage.setItem('syndic_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    // 1. Sauvegarde silencieuse
    performGlobalSave();
    
    // 2. Nettoyage radical de la session
    localStorage.removeItem('syndic_session');
    
    // 3. Reset React State
    setCurrentUser(null);
  };

  const handleSaveBuilding = (info: BuildingInfo, newApartments?: Apartment[]) => {
    setBuildingInfo(info);
    if (newApartments) {
      setApartments(newApartments);
      storage.saveBuildingData(info, newApartments);
    } else {
      storage.saveBuildingData(info, apartments);
    }
  };

  const handleHandleProfileRequest = (requestId: string, approved: boolean) => {
    const req = profileRequests.find(r => r.id === requestId);
    if (!req) return;
    if (approved) {
      const updatedApts = apartments.map(a => a.id === req.apartmentId ? { ...a, phone: req.newPhone } : a);
      setApartments(updatedApts);
      setProfileRequests(prev => prev.filter(r => r.id !== requestId));
    } else {
      setProfileRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    }
  };

  useEffect(() => {
    if (buildingInfo.isConfigured) performGlobalSave();
  }, [buildingInfo, apartments, assets, expenses, payments, assetPayments, projects, complaints, reminderHistory, profileRequests, performGlobalSave]);

  if (!currentUser) return <Login apartments={apartments} onLogin={handleLogin} />;

  const isAdmin = currentUser.role === 'admin';
  const badgeCounts = {
    owners: profileRequests.filter(r => r.status === 'pending').length,
    followup: complaints.filter(c => c.status === 'open').length + projects.filter(p => p.status === 'planned').length
  };

  return (
    <HashRouter>
      <Layout 
        onLogout={handleLogout} 
        currentUser={currentUser.username} 
        role={currentUser.role}
        badges={isAdmin ? badgeCounts : undefined}
      >
        <Routes>
          <Route path="/" element={isAdmin ? (buildingInfo.isConfigured ? <Dashboard apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo} /> : <Navigate to="/setup" replace />) : <Navigate to="/cash-state" replace />} />
          <Route path="/followup" element={<FollowUp apartments={apartments} projects={projects} complaints={complaints} currentUser={currentUser} onAddProject={p => setProjects([...projects, p])} onUpdateProject={u => setProjects(projects.map(p => p.id === u.id ? u : p))} onDeleteProject={id => setProjects(projects.filter(p => p.id !== id))} onAddComplaint={c => setComplaints([...complaints, c])} onUpdateComplaint={u => setComplaints(complaints.map(c => c.id === u.id ? u : c))} onDeleteComplaint={id => setComplaints(complaints.filter(c => c.id !== id))} buildingName={buildingInfo.name} />} />
          {!isAdmin && (
            <>
              <Route path="/cash-state" element={<OwnerDashboard apartment={apartments.find(a => a.id === currentUser.apartmentId) || apartments[0]} expenses={expenses} payments={payments} assetPayments={assetPayments} reminderHistory={reminderHistory} />} />
              <Route path="/profile" element={<OwnerProfile apartment={apartments.find(a => a.id === currentUser.apartmentId) || apartments[0]} onUpdateApt={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} onRequestPhoneChange={req => setProfileRequests([...profileRequests, { ...req, status: 'pending' }])} pendingRequests={profileRequests} onDismissRequest={id => setProfileRequests(prev => prev.filter(r => r.id !== id))} />} />
            </>
          )}
          {isAdmin && (
            <>
              <Route path="/assets" element={<AssetsManager assets={assets} assetPayments={assetPayments} onAddAsset={a => setAssets([...assets, a])} onUpdateAsset={ua => setAssets(assets.map(a => a.id === ua.id ? ua : a))} onDeleteAsset={id => setAssets(assets.filter(a => a.id !== id))} onAddPayment={ap => setAssetPayments([...assetPayments, ap])} onDeletePayment={pid => setAssetPayments(assetPayments.filter(p => p.id !== pid))} />} />
              <Route path="/setup" element={<BuildingSetup buildingInfo={buildingInfo} onSave={handleSaveBuilding} onImportFullDB={d => { if(d.data && d.data.building) { setBuildingInfo(d.data.building.building); setApartments(d.data.building.apartments); } }} fullData={storage.getFullExport()} currentApartmentsCount={apartments.length} />} />
              <Route path="/reminders" element={<ReminderCenter apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdateBuilding={setBuildingInfo} reminderHistory={reminderHistory} onAddReminderLog={l => setReminderHistory([...reminderHistory, l])} onClearHistory={() => setReminderHistory([])} />} />
              <Route path="/apartments" element={<Apartments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} onAdd={n => setApartments([...apartments, n])} onDelete={id => setApartments(apartments.filter(a => a.id !== id))} />} />
              <Route path="/owners" element={<Owners apartments={apartments} onUpdate={u => setApartments(apartments.map(a => a.id === u.id ? u : a))} profileRequests={profileRequests.filter(r => r.status === 'pending')} onHandleProfileRequest={handleHandleProfileRequest} />} />
              <Route path="/expenses" element={<Expenses expenses={expenses} onAdd={e => setExpenses([...expenses, e])} onUpdate={u => setExpenses(expenses.map(ex => ex.id === u.id ? u : ex))} onDelete={id => setExpenses(expenses.filter(e => e.id !== id))} />} />
              <Route path="/payments" element={<Payments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onTogglePayment={(aid, m, y) => {
                setPayments(prev => {
                  const ex = prev.find(p => p.apartmentId === aid && p.month === m && p.year === y);
                  if (ex) return prev.filter(p => p.id !== ex.id);
                  const apt = apartments.find(a => a.id === aid);
                  return [...prev, { id: `pay-${Date.now()}-${aid}-${m}`, apartmentId: aid, month: m, year: y, amount: apt?.monthlyFee || 0, paidDate: new Date().toISOString() }];
                });
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
