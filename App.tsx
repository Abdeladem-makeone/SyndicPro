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

// Composant Toast élégant
const Toast: React.FC<{ message: string, type: 'success' | 'error' | 'info', onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-600 shadow-emerald-200',
    error: 'bg-rose-600 shadow-rose-200',
    info: 'bg-indigo-600 shadow-indigo-200'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 ${styles[type]}`}>
      <i className={`fas ${icons[type]} text-lg`}></i>
      <span className="tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
    </div>
  );
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
    notificationsEnabled: false, reminderLanguage: 'fr', ownerInterfaceEnabled: false,
    ownerShowBalance: false, ownerShowExpenseRegister: false, ownerCanCreateOps: false
  });
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>([]);

  // État pour les notifications
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const loadData = useCallback(() => {
    const { building, apartments: apts } = storage.loadBuildingData();
    const { projects: proj, complaints: comp } = storage.loadOperations();
    const { payments: pay, expenses: exp, assetPayments: aPay } = storage.loadAllYearlyData();
    const reminders = storage.loadReminders();
    const buildingAssets = storage.loadAssets();
    const reqs = storage.loadProfileRequests();

    if (building) {
        if (building.ownerInterfaceEnabled === undefined) building.ownerInterfaceEnabled = false;
        setBuildingInfo(building);
    }
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
    notify(`Bienvenue ${user.username} !`);
  };

  const handleLogout = () => {
    localStorage.removeItem('syndic_session');
    setCurrentUser(null);
    notify("Déconnexion réussie", "info");
  };

  const toggleLanguage = (lang: 'fr' | 'ar') => {
    setLanguage(lang);
    localStorage.setItem('syndic_lang', lang);
    notify(lang === 'fr' ? "Langue : Français" : "اللغة: العربية", "info");
  };

  const handleTogglePayment = (aptId: string, month: number, year: number) => {
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return;

    const existingIndex = payments.findIndex(p => p.apartmentId === aptId && p.month === month && p.year === year);
    let newPayments = [...payments];

    if (existingIndex > -1) {
      newPayments.splice(existingIndex, 1);
      notify(`Paiement annulé pour l'appartement ${apt.number}`, "info");
    } else {
      newPayments.push({
        id: Date.now().toString(),
        apartmentId: aptId,
        month,
        year,
        amount: apt.monthlyFee,
        paidDate: new Date().toISOString()
      });
      notify(`Paiement enregistré pour l'appartement ${apt.number}`);
    }

    setPayments(newPayments);
    storage.saveYearlyFinance(year, newPayments, expenses, assetPayments);
  };

  // --- Profile Requests Handlers ---

  /**
   * Approves or rejects a profile update request from an owner.
   */
  const handleAdminProfileReview = (requestId: string, approved: boolean) => {
    const updatedRequests = profileRequests.map(r => 
      r.id === requestId ? { ...r, status: (approved ? 'approved' : 'rejected') as 'approved' | 'rejected' } : r
    );

    if (approved) {
      const req = profileRequests.find(r => r.id === requestId);
      if (req) {
        const updatedApts = apartments.map(a => 
          a.id === req.apartmentId ? { ...a, phone: req.newPhone } : a
        );
        setApartments(updatedApts);
        storage.saveBuildingData(buildingInfo, updatedApts);
      }
    }

    setProfileRequests(updatedRequests);
    storage.saveProfileRequests(updatedRequests);
  };

  /**
   * Submits a new profile update request from an owner.
   */
  const handleProfileRequest = (req: ProfileRequest) => {
    const updated = [req, ...profileRequests];
    setProfileRequests(updated);
    storage.saveProfileRequests(updated);
  };

  /**
   * Dismisses a rejected or processed request from the owner's view.
   */
  const handleDismissProfileRequest = (id: string) => {
    const updated = profileRequests.filter(r => r.id !== id);
    setProfileRequests(updated);
    storage.saveProfileRequests(updated);
  };

  if (!currentUser) return <Login apartments={apartments} buildingInfo={buildingInfo} onLogin={handleLogin} />;

  const isAdmin = currentUser.role === 'admin';
  const myApartment = !isAdmin ? apartments.find(a => a.id === currentUser.apartmentId) : null;

  if (!isAdmin && !buildingInfo.ownerInterfaceEnabled) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fas fa-lock"></i>
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Accès Désactivé</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Le gestionnaire a temporairement désactivé l'accès propriétaire.</p>
                <button onClick={handleLogout} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Retour</button>
            </div>
        </div>
      );
  }

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
                        notify("Initialisation terminée !");
                      } else {
                        storage.saveBuildingData(info, apartments);
                        notify("Paramètres sauvegardés");
                      }
                      loadData();
                    }} 
                    onImportFullDB={() => {}} 
                    fullData={storage.getFullExport()} 
                    currentApartmentsCount={apartments.length}
                    onNotify={notify}
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
                      notify(`Appartement ${apt.number} mis à jour`);
                    }} 
                    onAdd={(apt) => {
                      const newApts = [...apartments, apt];
                      setApartments(newApts);
                      storage.saveBuildingData(buildingInfo, newApts);
                      notify(`Appartement ${apt.number} ajouté`);
                    }} 
                    onDelete={(id) => {
                      const num = apartments.find(a => a.id === id)?.number;
                      const newApts = apartments.filter(a => a.id !== id);
                      setApartments(newApts);
                      storage.saveBuildingData(buildingInfo, newApts);
                      notify(`Appartement ${num} supprimé`, "info");
                    }} 
                  />
                } />
                <Route path="/payments" element={<Payments apartments={apartments} payments={payments} buildingInfo={buildingInfo} onTogglePayment={handleTogglePayment} onNotify={notify} />} />
                <Route path="/expenses" element={
                  <Expenses 
                    expenses={expenses} 
                    onAdd={(exp) => {
                      const newExp = [...expenses, exp];
                      setExpenses(newExp);
                      storage.saveYearlyFinance(new Date(exp.date).getFullYear(), payments, newExp, assetPayments);
                      notify("Dépense enregistrée");
                    }} 
                    onUpdate={(exp) => {
                      const newExp = expenses.map(e => e.id === exp.id ? exp : e);
                      setExpenses(newExp);
                      storage.saveYearlyFinance(new Date(exp.date).getFullYear(), payments, newExp, assetPayments);
                      notify("Dépense modifiée");
                    }} 
                    onDelete={(id) => {
                      const newExp = expenses.filter(e => e.id !== id);
                      setExpenses(newExp);
                      const item = expenses.find(e => e.id === id);
                      const year = item?.date ? new Date(item.date).getFullYear() : new Date().getFullYear();
                      storage.saveYearlyFinance(year, payments, newExp, assetPayments);
                      notify("Dépense supprimée", "info");
                    }} 
                  />
                } />
                <Route path="/owners" element={<Owners apartments={apartments} onUpdate={(apt) => {
                  const newApts = apartments.map(a => a.id === apt.id ? apt : a);
                  setApartments(newApts);
                  storage.saveBuildingData(buildingInfo, newApts);
                  notify(`Contact ${apt.owner} mis à jour`);
                }} profileRequests={profileRequests.filter(r => r.status === 'pending')} onHandleProfileRequest={(id, app) => {
                    handleAdminProfileReview(id, app);
                    notify(app ? "Changement approuvé" : "Changement rejeté", app ? "success" : "info");
                }} />} />
                <Route path="/reminders" element={
                  <ReminderCenter 
                    apartments={apartments} 
                    payments={payments} 
                    buildingInfo={buildingInfo} 
                    onUpdateBuilding={(info) => {
                      setBuildingInfo(info);
                      storage.saveBuildingData(info, apartments);
                      notify("Configuration WhatsApp mise à jour");
                    }} 
                    reminderHistory={reminderHistory} 
                    onAddReminderLog={(log) => {
                      const newLogs = [...reminderHistory, log];
                      setReminderHistory(newLogs);
                      storage.saveReminders(newLogs);
                      notify(`Rappel envoyé à ${log.ownerName}`);
                    }} 
                    onClearHistory={() => {
                      setReminderHistory([]);
                      storage.saveReminders([]);
                      notify("Historique vidé", "info");
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
                      notify("Nouveau bien ajouté");
                    }} 
                    onUpdateAsset={(a) => {
                      const next = assets.map(item => item.id === a.id ? a : item);
                      setAssets(next);
                      storage.saveAssets(next);
                      notify("Bien mis à jour");
                    }} 
                    onDeleteAsset={(id) => {
                      const next = assets.filter(item => item.id !== id);
                      setAssets(next);
                      storage.saveAssets(next);
                      notify("Bien supprimé", "info");
                    }} 
                    onAddPayment={(p) => {
                      const next = [...assetPayments, p];
                      setAssetPayments(next);
                      storage.saveYearlyFinance(p.year, payments, expenses, next);
                      notify("Revenu encaissé !");
                    }} 
                    onDeletePayment={(id) => {
                      const p = assetPayments.find(item => item.id === id);
                      const next = assetPayments.filter(item => item.id !== id);
                      setAssetPayments(next);
                      if (p) storage.saveYearlyFinance(p.year, payments, expenses, next);
                      notify("Paiement supprimé", "info");
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
                    buildingInfo={buildingInfo}
                    language={language}
                    onNotify={notify}
                  />
                } />
              </>
            ) : (
              <>
                <Route path="/" element={<OwnerDashboard apartment={myApartment!} expenses={expenses} payments={payments} assetPayments={assetPayments} reminderHistory={reminderHistory} buildingInfo={buildingInfo} language={language} />} />
                <Route path="/profile" element={<OwnerProfile apartment={myApartment!} onUpdateApt={(apt) => {
                   const next = apartments.map(a => a.id === apt.id ? apt : a);
                   setApartments(next);
                   storage.saveBuildingData(buildingInfo, next);
                   notify("Profil mis à jour");
                }} onRequestPhoneChange={(req) => {
                    handleProfileRequest(req);
                    notify("Demande envoyée au syndic", "info");
                }} pendingRequests={profileRequests} onDismissRequest={handleDismissProfileRequest} language={language} />} />
                <Route path="/followup" element={
                  <FollowUp 
                    apartments={apartments} 
                    projects={projects} 
                    complaints={complaints} 
                    currentUser={currentUser} 
                    onRefresh={loadData} 
                    buildingInfo={buildingInfo}
                    language={language}
                    onNotify={notify}
                  />
                } />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfigGuard>
      </Layout>
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </HashRouter>
  );
};

export default App;