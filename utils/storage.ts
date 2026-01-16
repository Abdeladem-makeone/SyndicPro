
import { BuildingInfo, Apartment, Expense, Payment, Project, Complaint, ReminderLog, BuildingAsset, AssetPayment } from '../types';

/**
 * Système de stockage simulé par "Fichiers JSON" dans le dossier virtuel /data/
 */
const DATA_FOLDER = {
  BUILDING: 'data/building_info.json',
  ASSETS: 'data/building_assets.json',
  OPS: 'data/ops_projects_complaints.json',
  REMINDERS: 'data/reminder_logs.json',
  COTIS_PREFIX: 'data/cotis_', // cotis_2026.json
  ASSET_PAY_PREFIX: 'data/asset_pay_', // asset_pay_2026.json
};

export const storage = {
  // --- FICHIER: data/building_info.json ---
  saveBuildingData: (building: BuildingInfo, apartments: Apartment[]) => {
    localStorage.setItem(DATA_FOLDER.BUILDING, JSON.stringify({ 
      lastUpdate: new Date().toISOString(),
      building, 
      apartments 
    }));
  },
  loadBuildingData: () => {
    const data = localStorage.getItem(DATA_FOLDER.BUILDING);
    return data ? JSON.parse(data) : { building: null, apartments: [] };
  },

  // --- FICHIER: data/building_assets.json ---
  saveAssets: (assets: BuildingAsset[]) => {
    localStorage.setItem(DATA_FOLDER.ASSETS, JSON.stringify({
      lastUpdate: new Date().toISOString(),
      assets
    }));
  },
  loadAssets: (): BuildingAsset[] => {
    const data = localStorage.getItem(DATA_FOLDER.ASSETS);
    return data ? JSON.parse(data).assets || [] : [];
  },

  // --- FICHIER: data/ops_projects_complaints.json ---
  saveOperations: (projects: Project[], complaints: Complaint[]) => {
    localStorage.setItem(DATA_FOLDER.OPS, JSON.stringify({ 
      lastUpdate: new Date().toISOString(),
      projects, 
      complaints 
    }));
  },
  loadOperations: () => {
    const data = localStorage.getItem(DATA_FOLDER.OPS);
    return data ? JSON.parse(data) : { projects: [], complaints: [] };
  },

  // --- FICHIERS ANNUELS: Cotisations et Revenus des Biens ---
  saveYearlyFinance: (year: number, payments: Payment[], expenses: Expense[], assetPayments: AssetPayment[]) => {
    // Save Apartments Cotisations
    const yearPayments = payments.filter(p => p.year === year);
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
    localStorage.setItem(`${DATA_FOLDER.COTIS_PREFIX}${year}.json`, JSON.stringify({
      year,
      payments: yearPayments,
      expenses: yearExpenses,
      lastUpdate: new Date().toISOString()
    }));

    // Save Asset Income
    const yearAssetPay = assetPayments.filter(ap => ap.year === year);
    localStorage.setItem(`${DATA_FOLDER.ASSET_PAY_PREFIX}${year}.json`, JSON.stringify({
      year,
      payments: yearAssetPay,
      lastUpdate: new Date().toISOString()
    }));
  },

  loadAllYearlyData: () => {
    const allPayments: Payment[] = [];
    const allExpenses: Expense[] = [];
    const allAssetPayments: AssetPayment[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DATA_FOLDER.COTIS_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allPayments.push(...data.payments);
        if (data.expenses) allExpenses.push(...data.expenses);
      }
      if (key?.startsWith(DATA_FOLDER.ASSET_PAY_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allAssetPayments.push(...data.payments);
      }
    }
    return { payments: allPayments, expenses: allExpenses, assetPayments: allAssetPayments };
  },

  // --- FICHIER: data/reminder_logs.json ---
  saveReminders: (logs: ReminderLog[]) => {
    localStorage.setItem(DATA_FOLDER.REMINDERS, JSON.stringify(logs));
  },
  loadReminders: () => {
    const data = localStorage.getItem(DATA_FOLDER.REMINDERS);
    return data ? JSON.parse(data) : [];
  },
  clearReminders: () => {
    localStorage.setItem(DATA_FOLDER.REMINDERS, JSON.stringify([]));
  },

  getFullExport: () => {
    return {
      version: "3.0",
      exportDate: new Date().toISOString(),
      core: storage.loadBuildingData(),
      assets: storage.loadAssets(),
      ops: storage.loadOperations(),
      finance: storage.loadAllYearlyData(),
      reminders: storage.loadReminders()
    };
  }
};
