
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FollowUp from './pages/FollowUp';
import Apartments from './pages/Apartments';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Owners from './pages/Owners';
import ReminderCenter from './pages/ReminderCenter';
import AssetsManager from './pages/AssetsManager';
import BuildingSetup from './pages/BuildingSetup';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProfile from './pages/OwnerProfile';
import { Apartment, Expense, Payment, BuildingInfo, Project, Complaint, User, ReminderLog, BuildingAsset, AssetPayment, ProfileRequest } from './types';
import { storage } from './utils/storage';
import React, { useState, useEffect, useCallback } from 'react';

const ConfigGuard: React.FC<{ isConfigured: boolean; children: React.ReactNode }> = ({ isConfigured, children }) => {
  const location = useLocation();
  if (!isConfigured && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('syndic_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [language, setLanguage] = useState<'fr' | 'ar'>(() => {
    return (localStorage.getItem('syndic_lang') as 'fr' | 'ar') || 'fr';
  });

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assets, setAssets] = useState<BuildingAsset[]>([]);
  const [assetPayments, setAssetPayments] = useState<AssetPayment[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileRequest[]>([]);
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo>({
    name: '', address: '', totalUnits: 0, unitsPerFloor: 0, numFloors: 0, 
    defaultMonthlyFee: 50, isConfigured: false, autoRemindersEnabled: false, 
    notificationsEnabled: false, reminderLanguage: 'fr'
  });
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>([]);

  const loadData = useCallback(() => {
    const { building, apartments: apts } = storage.loadBuildingData();
    const { projects: proj, complaints: comp } = storage.loadOperations();
    const { payments: pay, expenses: exp, assetPayments: aPay } = storage.loadAllYearlyData();
    const reminders = storage.loadReminders();
    const buildingAssets = storage.loadAssets();
    const reqs = storage.loadProfileRequests();

    if (building) setBuildingInfo(building);
    setApartments(apts || []);
    setProjects(proj || []);
    setComplaints(comp || []);
    setPayments(pay || []);
    setExpenses(exp || []);
    setAssetPayments(aPay || []);
    setAssets(buildingAssets || []);
    setReminderHistory(reminders || []);
    setProfileRequests(reqs || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (user: User) => {
    localStorage.setItem('syndic_session', JSON.stringify(user));
    setCurrentUser(user);
    if (user.language) {
      setLanguage(user.language);
      localStorage.setItem('syndic_lang', user.language);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('syndic_session');
    setCurrentUser(null);
  };

  const toggleLanguage = (lang: 'fr' | 'ar') => {
    setLanguage(lang);
    localStorage.setItem('syndic_lang', lang);
  };

  const handleTogglePayment = (aptId: string, month: number, year: number) => {
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return;

    const existingIndex = payments.findIndex(p => p.apartmentId === aptId && p.month === month && p.year === year);
    let newPayments = [...payments];

    if (existingIndex > -1) {
      newPayments.splice(existingIndex, 1);
    } else {
      newPayments.push({
        id: Date.now().toString(),
        apartmentId: aptId,
        month,
        year,
        amount: apt.monthlyFee,
        paidDate: new Date().toISOString()
      });
    }

    setPayments(newPayments);
    storage.saveYearlyFinance(year, newPayments, expenses, assetPayments);
  };

  const handleProfileRequest = (req: ProfileRequest) => {
    const next = [...profileRequests, req];
    setProfileRequests(next);
    storage.saveProfileRequests(next);
  };

  const handleAdminProfileReview = (id: string, approved: boolean) => {
    const req = profileRequests.find(r => r.id === id);
    if (!req) return;

    if (approved) {
      const nextApts = apartments.map(a => a.id === req.apartmentId ? { ...a, phone: req.newPhone } : a);
      setApartments(nextApts);
      storage.saveBuildingData(buildingInfo, nextApts);
      const nextReqs = profileRequests.filter(r => r.id !== id);
      setProfileRequests(nextReqs);
      storage.saveProfileRequests(nextReqs);
    } else {
      const nextReqs = profileRequests.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r);
      setProfileRequests(nextReqs);
      storage.saveProfileRequests(nextReqs);
    }
    alert(approved ? "Approuvé." : "Rejeté.");
  };

  const handleDismissProfileRequest = (id: string) => {
    const nextReqs = profileRequests.filter(r => r.id !== id);
    setProfileRequests(nextReqs);
    storage.saveProfileRequests(nextReqs);
  };

  if (!currentUser) return <Login apartments={apartments} onLogin={handleLogin} />;

  const isAdmin = currentUser.role === 'admin';
  const myApartment = !isAdmin ? apartments.find(a => a.id === currentUser.apartmentId) : null;

  return (
    <HashRouter>
      <Layout 
        onLogout={handleLogout} 
        currentUser={currentUser.username} 
        role={currentUser.role} 
        language={language}
        onLanguageToggle={toggleLanguage}
        badges={{ owners: profileRequests.filter(r => r.status === 'pending').length }}
      >
        <ConfigGuard isConfigured={buildingInfo.isConfigured}>
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<Dashboard apartments={apartments} expenses={expenses} payments={payments} assetPayments={assetPayments} buildingInfo={buildingInfo} />} />
                <Route path="/setup" element={
                  <BuildingSetup 
                    buildingInfo={buildingInfo} 
                    onSave={(info, newApts) => {
                      setBuildingInfo(info);
                      if (newApts) {
                        setApartments(newApts);
                        storage.initialize(info, newApts);
                      } else {
                        storage.saveBuildingData(info, apartments);
                      }
                      loadData();
                    }} 
                    onImportFullDB={() => {}} 
                    fullData={storage.getFullExport()} 
                    currentApartmentsCount={apartments.length}
                  />
                } />
                <Route path="/apartments" element={
                  <Apartments 
                    apartments={apartments} 
                    payments={payments} 
                    buildingInfo={buildingInfo} 
                    onUpdate={(apt) => {
                      const newApts = apartments.map(a => a.id === apt.id ? apt : a);
                      setApartments(newApts);
                      storage.saveBuildingData(buildingInfo, newApts);
                    }} 
                    onAdd={(apt) => {
                      const newApts = [...apartments, apt];
                      setApartments(newApts);
                      storage.saveBuildingData(buildingInfo, newApts);
                    }} 
                    onDelete={(id) => {
                      const newApts = apartments.filter(a => a.id !== id);
                      setApartments(newApts);
                      storage.saveBuildingData(buildingInfo, newApts);
                    }} 
                  />
                } />
                <Route path="/payments" element={<Payments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onTogglePayment={handleTogglePayment} />} />
                <Route path="/expenses" element={
                  <Expenses 
                    expenses={expenses} 
                    onAdd={(exp) => {
                      const newExp = [...expenses, exp];
                      setExpenses(newExp);
                      storage.saveYearlyFinance(new Date(exp.date).getFullYear(), payments, newExp, assetPayments);
                    }} 
                    onUpdate={(exp) => {
                      const newExp = expenses.map(e => e.id === exp.id ? exp : e);
                      setExpenses(newExp);
                      storage.saveYearlyFinance(new Date(exp.date).getFullYear(), payments, newExp, assetPayments);
                    }} 
                    onDelete={(id) => {
                      const newExp = expenses.filter(e => e.id !== id);
                      setExpenses(newExp);
                      const year = expenses.find(e => e.id === id)?.date ? new Date(expenses.find(e => e.id === id)!.date).getFullYear() : new Date().getFullYear();
                      storage.saveYearlyFinance(year, payments, newExp, assetPayments);
                    }} 
                  />
                } />
                <Route path="/owners" element={<Owners apartments={apartments} onUpdate={(apt) => {
                  const newApts = apartments.map(a => a.id === apt.id ? apt : a);
                  setApartments(newApts);
                  storage.saveBuildingData(buildingInfo, newApts);
                }} profileRequests={profileRequests.filter(r => r.status === 'pending')} onHandleProfileRequest={handleAdminProfileReview} />} />
                <Route path="/reminders" element={
                  <ReminderCenter 
                    apartments={apartments} 
                    payments={payments} 
                    buildingInfo={buildingInfo} 
                    onUpdateBuilding={(info) => {
                      setBuildingInfo(info);
                      storage.saveBuildingData(info, apartments);
                    }} 
                    reminderHistory={reminderHistory} 
                    onAddReminderLog={(log) => {
                      const newLogs = [...reminderHistory, log];
                      setReminderHistory(newLogs);
                      storage.saveReminders(newLogs);
                    }} 
                    onClearHistory={() => {
                      setReminderHistory([]);
                      storage.saveReminders([]);
                    }}
                  />
                } />
                <Route path="/assets" element={
                  <AssetsManager 
                    assets={assets} 
                    assetPayments={assetPayments} 
                    onAddAsset={(a) => {
                      const next = [...assets, a];
                      setAssets(next);
                      storage.saveAssets(next);
                    }} 
                    onUpdateAsset={(a) => {
                      const next = assets.map(item => item.id === a.id ? a : item);
                      setAssets(next);
                      storage.saveAssets(next);
                    }} 
                    onDeleteAsset={(id) => {
                      const next = assets.filter(item => item.id !== id);
                      setAssets(next);
                      storage.saveAssets(next);
                    }} 
                    onAddPayment={(p) => {
                      const next = [...assetPayments, p];
                      setAssetPayments(next);
                      storage.saveYearlyFinance(p.year, payments, expenses, next);
                    }} 
                    onDeletePayment={(id) => {
                      const p = assetPayments.find(item => item.id === id);
                      const next = assetPayments.filter(item => item.id !== id);
                      setAssetPayments(next);
                      if (p) storage.saveYearlyFinance(p.year, payments, expenses, next);
                    }} 
                  />
                } />
                <Route path="/reports" element={<Reports apartments={apartments} expenses={expenses} payments={payments} buildingInfo={buildingInfo} />} />
                <Route path="/followup" element={
                  <FollowUp 
                    apartments={apartments} 
                    projects={projects} 
                    complaints={complaints} 
                    currentUser={currentUser} 
                    onRefresh={loadData} 
                    language={language}
                  />
                } />
              </>
            ) : (
              <>
                <Route path="/" element={<OwnerDashboard apartment={myApartment!} expenses={expenses} payments={payments} assetPayments={assetPayments} reminderHistory={reminderHistory} language={language} />} />
                <Route path="/profile" element={<OwnerProfile apartment={myApartment!} onUpdateApt={(apt) => {
                   const next = apartments.map(a => a.id === apt.id ? apt : a);
                   setApartments(next);
                   storage.saveBuildingData(buildingInfo, next);
                }} onRequestPhoneChange={handleProfileRequest} pendingRequests={profileRequests} onDismissRequest={handleDismissProfileRequest} language={language} />} />
                <Route path="/followup" element={
                  <FollowUp 
                    apartments={apartments} 
                    projects={projects} 
                    complaints={complaints} 
                    currentUser={currentUser} 
                    onRefresh={loadData} 
                    language={language}
                  />
                } />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfigGuard>
      </Layout>
    </HashRouter>
  );
};

export default App;
