
export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'manager';
}

export interface BuildingInfo {
  name: string;
  address: string;
  totalUnits: number;
  unitsPerFloor: number;
  numFloors: number; 
  defaultMonthlyFee: number;
  isConfigured: boolean;
  autoRemindersEnabled: boolean;
  reminderLanguage: 'ar' | 'fr';
  whatsappTemplate?: string;
  whatsappDetailedTemplate?: string;
}

export interface ReminderLog {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  ownerName: string;
  date: string;
  type: 'simple' | 'detailed';
}

export interface Apartment {
  id: string;
  number: string;
  owner: string;
  shares: number;
  monthlyFee: number;
  floor: number;
  phone: string;
  email: string;
}

export interface BuildingAsset {
  id: string;
  name: string;
  description: string;
  incomeAmount: number;
  frequency: 'monthly' | 'yearly';
  category: 'rent' | 'telecom' | 'advertising' | 'other';
}

export interface AssetPayment {
  id: string;
  assetId: string;
  amount: number;
  date: string;
  period: string; // "Janvier 2026" ou "Année 2026"
  year: number;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  excludedFromReports?: boolean;
}

export enum ExpenseCategory {
  MAINTENANCE = 'Maintenance',
  ELECTRICITY = 'Électricité',
  WATER = 'Eau',
  CLEANING = 'Nettoyage',
  REPAIRS = 'Réparations',
  INSURANCE = 'Assurance',
  OTHER = 'Autre'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedBudget?: number;
}

export interface Complaint {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  date: string;
  description: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
}

export interface Payment {
  id: string;
  apartmentId: string;
  month: number;
  year: number;
  amount: number;
  paidDate: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  collectionRate: number;
}
