
import React, { useState, useMemo } from 'react';
import { Apartment, Payment, BuildingInfo } from '../types';
import { MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';

interface PaymentsProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onTogglePayment: (aptId: string, month: number, year: number) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const Payments: React.FC<PaymentsProps> = ({ apartments, payments, buildingInfo, onTogglePayment, onNotify }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<'apartment' | 'monthly'>('apartment');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');

  const years = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentYear + i);
  }, [currentYear]);

  const isPaid = (aptId: string, month: number) => {
    return payments.some(p => p.apartmentId === aptId && p.month === month && p.year === selectedYear);
  };

  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apartments, searchTerm]);

  const stats = useMemo(() => {
    if (viewMode === 'monthly') {
      const expected = apartments.reduce((sum, a) => sum + a.monthlyFee, 0);
      const collected = payments
        .filter(p => p.month === selectedMonth && p.year === selectedYear)
        .reduce((sum, p) => sum + p.amount, 0);
      return { expected, collected, remaining: expected - collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
    } else {
      const expected = apartments.reduce((sum, a) => sum + a.monthlyFee, 0) * 12;
      const collected = payments
        .filter(p => p.year === selectedYear)
        .reduce((sum, p) => sum + p.amount, 0);
      return { expected, collected, remaining: expected - collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
    }
  }, [apartments, payments, selectedMonth, selectedYear, viewMode]);

  const handleMarkAllPaid = () => {
    if (confirm(`Marquer tous les appartements (${filteredApartments.length}) comme payés pour ${MONTHS[selectedMonth]} ?`)) {
      filteredApartments.forEach(apt => {
        if (!isPaid(apt.id, selectedMonth)) {
          onTogglePayment(apt.id, selectedMonth, selectedYear);
        }
      });
      onNotify?.(`${filteredApartments.length} paiements validés pour ${MONTHS[selectedMonth]}`);
    }
  };

  const handleExportPDF = () => {
    onNotify?.("Génération du PDF...", "info");
    if (viewMode === 'apartment') {
      const headers = ['Appartement', 'Propriétaire', ...MONTHS.map(m => m.substring(0, 3))];
      const rows = filteredApartments.map(apt => [
        apt.number,
        apt.owner,
        ...MONTHS.map((_, idx) => isPaid(apt.id, idx) ? 'OK' : '-')
      ]);
      exportToPDF(`Suivi Cotisations ${selectedYear}`, headers, rows, `cotisations_${selectedYear}`);
    } else {
      const headers = ['Appartement', 'Propriétaire', 'Statut', 'Montant'];
      const rows = filteredApartments.map(apt => [
        apt.number,
        apt.owner,
        isPaid(apt.id, selectedMonth) ? 'PAYÉ' : 'ATTENTE',
        `${apt.monthlyFee} DH`
      ]);
      exportToPDF(`Cotisations ${MONTHS[selectedMonth]} ${selectedYear}`, headers, rows, `cotis_${MONTHS[selectedMonth]}_${selectedYear}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="space-y-4 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800">Suivi des Cotisations</h2>
            <div className="flex bg-slate-200 p-1.5 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto no-scrollbar">
              {years.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedYear === y ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative w-full sm:w-80">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Rechercher appartement ou propriétaire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all" />
             </div>
             <div className="bg-slate-200/50 p-1.5 rounded-2xl flex self-start border border-slate-200 shadow-inner">
                <button onClick={() => setViewMode('apartment')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'apartment' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>
                  <i className="fas fa-table-cells"></i> Annuel
                </button>
                <button onClick={() => setViewMode('monthly')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'monthly' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>
                  <i className="fas fa-calendar-day"></i> Mensuel
                </button>
             </div>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto">
          {viewMode === 'monthly' && (
            <button 
              onClick={handleMarkAllPaid}
              className="flex-1 xl:flex-none bg-green-50 text-green-700 border border-green-200 px-6 py-3.5 rounded-2xl hover:bg-green-100 transition-all text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              <i className="fas fa-check-double"></i> Tout Payer
            </button>
          )}
          <button onClick={handleExportPDF} className="flex-1 xl:flex-none bg-slate-800 text-white px-6 py-3.5 rounded-2xl hover:bg-slate-900 transition-all text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-slate-200">
            <i className="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendu</p>
           <p className="text-xl font-black text-slate-800">{stats.expected.toLocaleString()} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encaissé</p>
           <p className="text-xl font-black text-green-600">{stats.collected.toLocaleString()} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste</p>
           <p className="text-xl font-black text-red-500">{stats.remaining.toLocaleString()} DH</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
           <div className="flex justify-between items-center mb-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux</p>
             <span className="text-xs font-black text-indigo-600">{stats.rate.toFixed(0)}%</span>
           </div>
           <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
             <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${stats.rate}%` }}></div>
           </div>
        </div>
      </div>

      {viewMode === 'monthly' && (
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-1.5 overflow-x-auto no-scrollbar">
          {MONTHS.map((m, idx) => (
            <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${selectedMonth === idx ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          {viewMode === 'apartment' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-20 shadow-sm min-w-[160px]">Appartement</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-3 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center min-w-[70px]">{m.substring(0, 3)}</th>
                  ))}
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center bg-slate-50 sticky right-0 z-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApartments.map((apt) => {
                  const paidInYear = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear).length;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r shadow-sm transition-colors">
                        <div className="flex flex-col">
                          <span className="font-black text-indigo-600 text-sm leading-tight">{apt.number}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{apt.owner}</span>
                        </div>
                      </td>
                      {MONTHS.map((_, idx) => (
                        <td key={idx} className="px-1 py-5 text-center">
                          <button onClick={() => onTogglePayment(apt.id, idx, selectedYear)} className={`w-10 h-10 rounded-2xl transition-all flex items-center justify-center mx-auto border-2 ${isPaid(apt.id, idx) ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'bg-white border-slate-100 text-slate-200 hover:border-indigo-300 hover:text-indigo-400'}`}>
                            <i className={`fas ${isPaid(apt.id, idx) ? 'fa-check text-xs' : 'fa-minus text-[10px]'}`}></i>
                          </button>
                        </td>
                      ))}
                      <td className="px-8 py-5 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l shadow-sm transition-colors">
                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl ${paidInYear === 12 ? 'bg-green-100 text-green-700' : paidInYear > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {paidInYear}/12
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Appartement</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Propriétaire</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Statut</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Cotisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApartments.map((apt) => {
                  const paid = isPaid(apt.id, selectedMonth);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5 font-black text-indigo-600">{apt.number}</td>
                      <td className="px-8 py-5 font-bold text-slate-700">{apt.owner}</td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => onTogglePayment(apt.id, selectedMonth, selectedYear)} className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black transition-all border-2 ${paid ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}>
                          <i className={`fas ${paid ? 'fa-check-circle' : 'fa-clock'}`}></i>
                          {paid ? 'PAYÉ' : 'EN ATTENTE'}
                        </button>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-800">{apt.monthlyFee.toLocaleString()} DH</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
