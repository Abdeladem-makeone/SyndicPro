
import { BuildingInfo, Apartment, Expense, Payment, Project, Complaint, ReminderLog, BuildingAsset, AssetPayment } from '../types';

const DATA_PATHS = {
  BUILDING: 'data/building_info.json',
  ASSETS: 'data/building_assets.json',
  OPS: 'data/ops_projects_complaints.json',
  REMINDERS: 'data/reminder_logs.json',
  COTIS_PREFIX: 'data/cotis_',
  ASSET_PAY_PREFIX: 'data/asset_pay_',
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && (e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert("⚠️ Stockage plein : Les données n'ont pas pu être totalement sauvegardées.");
    }
  }
};

export const storage = {
  exists: () => localStorage.getItem(DATA_PATHS.BUILDING) !== null,

  initialize: (building: BuildingInfo, apartments: Apartment[]) => {
    safeSetItem(DATA_PATHS.BUILDING, JSON.stringify({ building, apartments, created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.ASSETS, JSON.stringify({ assets: [], created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.OPS, JSON.stringify({ projects: [], complaints: [], created: new Date().toISOString() }));
    safeSetItem(DATA_PATHS.REMINDERS, JSON.stringify([]));
  },

  saveBuildingData: (building: BuildingInfo, apartments: Apartment[]) => {
    safeSetItem(DATA_PATHS.BUILDING, JSON.stringify({ building, apartments, lastUpdate: new Date().toISOString() }));
  },

  loadBuildingData: () => {
    const data = localStorage.getItem(DATA_PATHS.BUILDING);
    return data ? JSON.parse(data) : { building: null, apartments: [] };
  },

  saveAssets: (assets: BuildingAsset[]) => {
    safeSetItem(DATA_PATHS.ASSETS, JSON.stringify({ assets, lastUpdate: new Date().toISOString() }));
  },

  loadAssets: (): BuildingAsset[] => {
    const data = localStorage.getItem(DATA_PATHS.ASSETS);
    return data ? JSON.parse(data).assets || [] : [];
  },

  saveOperations: (projects: Project[], complaints: Complaint[]) => {
    safeSetItem(DATA_PATHS.OPS, JSON.stringify({ projects, complaints, lastUpdate: new Date().toISOString() }));
  },

  loadOperations: () => {
    const data = localStorage.getItem(DATA_PATHS.OPS);
    return data ? JSON.parse(data) : { projects: [], complaints: [] };
  },

  saveYearlyFinance: (year: number, payments: Payment[], expenses: Expense[], assetPayments: AssetPayment[]) => {
    const yearPayments = payments.filter(p => p.year === year);
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
    safeSetItem(`${DATA_PATHS.COTIS_PREFIX}${year}.json`, JSON.stringify({ year, payments: yearPayments, expenses: yearExpenses }));

    const yearAssetPay = assetPayments.filter(ap => ap.year === year);
    safeSetItem(`${DATA_PATHS.ASSET_PAY_PREFIX}${year}.json`, JSON.stringify({ year, payments: yearAssetPay }));
  },

  loadAllYearlyData: () => {
    const allPayments: Payment[] = [];
    const allExpenses: Expense[] = [];
    const allAssetPayments: AssetPayment[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DATA_PATHS.COTIS_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allPayments.push(...data.payments);
        if (data.expenses) allExpenses.push(...data.expenses);
      }
      if (key?.startsWith(DATA_PATHS.ASSET_PAY_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.payments) allAssetPayments.push(...data.payments);
      }
    }
    return { payments: allPayments, expenses: allExpenses, assetPayments: allAssetPayments };
  },

  saveReminders: (logs: ReminderLog[]) => {
    safeSetItem(DATA_PATHS.REMINDERS, JSON.stringify(logs));
  },

  loadReminders: () => {
    const data = localStorage.getItem(DATA_PATHS.REMINDERS);
    return data ? JSON.parse(data) : [];
  },

  getFullExport: () => ({
    version: "4.0",
    exportDate: new Date().toISOString(),
    data: {
      building: storage.loadBuildingData(),
      assets: storage.loadAssets(),
      operations: storage.loadOperations(),
      finances: storage.loadAllYearlyData(),
      reminders: storage.loadReminders()
    }
  })
};
