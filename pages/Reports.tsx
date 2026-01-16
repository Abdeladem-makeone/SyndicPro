
import React, { useState } from 'react';
import { Apartment, Expense, Payment } from '../types';
import { exportAnnualReportPDF, exportCashStatePDF } from '../utils/pdfUtils';
import { MONTHS } from '../constants';

interface ReportsProps {
  apartments: Apartment[];
  expenses: Expense[];
  payments: Payment[];
  buildingInfo: any;
}

const Reports: React.FC<ReportsProps> = ({ apartments, expenses, payments, buildingInfo }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const calculateAnnualMetrics = (year: number) => {
    const yearPayments = payments.filter(p => p.year === year);
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year && !e.excludedFromReports);
    
    const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const expectedRevenue = apartments.reduce((sum, a) => sum + a.monthlyFee, 0) * 12;
    const collectionRate = expectedRevenue > 0 ? (totalRevenue / expectedRevenue) * 100 : 0;

    return { totalRevenue, totalExpenses, balance: totalRevenue - totalExpenses, collectionRate };
  };

  const handleExportAnnualReport = () => {
    const metrics = calculateAnnualMetrics(selectedYear);
    const unpaidList = apartments.map(apt => {
      const aptPayments = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear);
      const paidCount = aptPayments.length;
      const unpaidCount = 12 - paidCount;
      return {
        number: apt.number,
        owner: apt.owner,
        unpaidCount,
        totalOwed: unpaidCount * apt.monthlyFee
      };
    }).filter(item => item.unpaidCount > 0);

    const categories = expenses
      .filter(e => new Date(e.date).getFullYear() === selectedYear && !e.excludedFromReports)
      .reduce((acc: Record<string, number>, e: Expense) => {
        // Explicitly typed accumulator and expense to fix numeric context errors
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    // Explicitly casting Object.values to number[] to fix 'unknown' arithmetic errors
    const totalExp = (Object.values(categories) as number[]).reduce((a: number, b: number) => a + b, 0);
    const expenseBreakdown = (Object.entries(categories) as [string, number][]).map(([name, value]) => ({
      name,
      value,
      percentage: totalExp > 0 ? (value / totalExp) * 100 : 0
    }));

    exportAnnualReportPDF(buildingInfo.name, selectedYear, metrics, unpaidList, expenseBreakdown);
  };

  const handleExportCashState = () => {
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.filter(e => !e.excludedFromReports).reduce((sum, e) => sum + e.amount, 0);
    const summary = { totalRevenue, totalExpenses, balance: totalRevenue - totalExpenses };

    const allTransactions = [
      ...payments.map(p => {
        const apt = apartments.find(a => a.id === p.apartmentId);
        return {
          date: new Date(p.paidDate).toLocaleDateString('fr-FR'),
          rawDate: new Date(p.paidDate),
          type: 'RECETTE',
          description: `Cotisation ${MONTHS[p.month]} ${p.year} - ${apt?.number || 'App.'}`,
          amount: `+${p.amount} DH`,
          isExpense: false
        };
      }),
      ...expenses.map(e => ({
        date: new Date(e.date).toLocaleDateString('fr-FR'),
        rawDate: new Date(e.date),
        type: 'DÉPENSE',
        description: e.excludedFromReports ? `(EXCLU) ${e.description}` : e.description,
        amount: `-${e.amount} DH`,
        isExpense: true
      }))
    ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 20);

    exportCashStatePDF(buildingInfo.name, summary, allTransactions);
  };

  const metrics = calculateAnnualMetrics(selectedYear);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bilans & Rapports</h2>
          <p className="text-slate-500">Générez vos documents officiels de gestion.</p>
          <div className="flex gap-2 mt-3">
            {[2024, 2025, 2026].map(y => (
              <button 
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedYear === y ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={handleExportCashState}
            className="flex-1 lg:flex-none bg-slate-800 text-white px-5 py-3 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <i className="fas fa-wallet"></i> État de Caisse
          </button>
          
          <button 
            onClick={handleExportAnnualReport}
            className="flex-1 lg:flex-none bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <i className="fas fa-file-pdf"></i> Bilan Annuel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
               <i className="fas fa-calendar-check text-indigo-500"></i> Performance {selectedYear}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Recettes Encaissées</span>
                <span className="font-bold text-green-600">+{metrics.totalRevenue.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dépenses Annuelles (Incluses)</span>
                <span className="font-bold text-red-600">-{metrics.totalExpenses.toLocaleString()} DH</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-slate-800">Résultat Fiscal {selectedYear}</span>
                <span className={`font-bold ${metrics.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  {metrics.balance.toLocaleString()} DH
                </span>
              </div>
              <div className="pt-4 border-t">
                 <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Taux de recouvrement</span>
                    <span>{metrics.collectionRate.toFixed(1)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000" 
                      style={{ width: `${Math.min(metrics.collectionRate, 100)}%` }}
                    ></div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-lg border border-white/10">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-indigo-300"></i> Aide à la Gestion
          </h3>
          <p className="text-sm text-indigo-100/80 leading-relaxed mb-4">
            Utilisez les boutons ci-dessus pour générer des documents PDF clairs pour vos assemblées générales ou votre suivi quotidien.
          </p>
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs italic text-indigo-200">
             Les rapports sont optimisés pour une impression standard A4.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
