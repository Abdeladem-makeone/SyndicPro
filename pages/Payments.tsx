
import React, { useState, useMemo } from 'react';
import { Apartment, Payment, BuildingInfo } from '../types';
import { MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';

interface PaymentsProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onTogglePayment: (aptId: string, month: number, year: number) => void;
  // Ajout potentiel d'une action groupée via le composant parent
  onBulkPay?: (aptIds: string[], month: number, year: number) => void;
}

const Payments: React.FC<PaymentsProps> = ({ apartments, payments, buildingInfo, onTogglePayment }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'apartment' | 'monthly'>('apartment');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');

  const years = [2024, 2025, 2026, 2027];

  const isPaid = (aptId: string, month: number) => {
    return payments.some(p => p.apartmentId === aptId && p.month === month && p.year === selectedYear);
  };

  // Filtrage des appartements
  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apartments, searchTerm]);

  // Calculs financiers pour la synthèse
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

  const handleExportPDF = () => {
    if (viewMode === 'apartment') {
      const headers = ['Appartement', 'Propriétaire', ...MONTHS.map(m => m.substring(0, 3))];
      const rows = filteredApartments.map(apt => [
        apt.number,
        apt.owner,
        ...MONTHS.map((_, idx) => isPaid(apt.id, idx) ? 'OK' : '-')
      ]);
      exportToPDF(`Suivi Annuel Cotisations - ${selectedYear}`, headers, rows, `suivi_annuel_${selectedYear}`);
    } else {
      const headers = ['Appartement', 'Propriétaire', 'Statut', 'Montant'];
      const rows = filteredApartments.map(apt => [
        apt.number,
        apt.owner,
        isPaid(apt.id, selectedMonth) ? 'PAYÉ' : 'ATTENTE',
        `${apt.monthlyFee} DH`
      ]);
      exportToPDF(`Point Cotisations - ${MONTHS[selectedMonth]} ${selectedYear}`, headers, rows, `cotisations_${MONTHS[selectedMonth]}_${selectedYear}`);
    }
  };

  const handleMarkAllPaid = () => {
    if (confirm(`Voulez-vous marquer tous les appartements filtrés (${filteredApartments.length}) comme payés pour ${MONTHS[selectedMonth]} ${selectedYear} ?`)) {
      filteredApartments.forEach(apt => {
        if (!isPaid(apt.id, selectedMonth)) {
          onTogglePayment(apt.id, selectedMonth, selectedYear);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils supérieure */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div className="space-y-4 w-full xl:w-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Suivi des Cotisations</h2>
            <div className="flex bg-slate-200 p-1 rounded-xl">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedYear === y ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="text"
                  placeholder="Rechercher lot ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                />
             </div>
             <div className="bg-slate-100 p-1 rounded-xl flex self-start">
                <button 
                  onClick={() => setViewMode('apartment')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'apartment' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <i className="fas fa-table-cells"></i> Vue Annuelle
                </button>
                <button 
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <i className="fas fa-calendar-day"></i> Vue Mensuelle
                </button>
             </div>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto">
          {viewMode === 'monthly' && (
            <button 
              onClick={handleMarkAllPaid}
              className="flex-1 xl:flex-none bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-100 transition-all text-xs font-bold flex items-center justify-center gap-2"
            >
              <i className="fas fa-check-double"></i> Tout payer
            </button>
          )}
          <button 
            onClick={handleExportPDF}
            className="flex-1 xl:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold flex items-center justify-center gap-2"
          >
            <i className="fas fa-download"></i> Exporter PDF
          </button>
        </div>
      </div>

      {/* Widgets de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Attendu</p>
           <p className="text-xl font-black text-slate-800">{stats.expected.toLocaleString()} <span className="text-xs">DH</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encaissé</p>
           <p className="text-xl font-black text-green-600">{stats.collected.toLocaleString()} <span className="text-xs">DH</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reste à percevoir</p>
           <p className="text-xl font-black text-red-500">{stats.remaining.toLocaleString()} <span className="text-xs">DH</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recouvrement</p>
             <span className="text-xs font-black text-indigo-600">{stats.rate.toFixed(0)}%</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${stats.rate}%` }}></div>
           </div>
        </div>
      </div>

      {/* Sélecteur de mois pour vue mensuelle */}
      {viewMode === 'monthly' && (
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-1 overflow-x-auto no-scrollbar">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedMonth === idx ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Tableaux de données */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'apartment' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] min-w-[180px]">Lot / Propriétaire</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-2 py-4 text-[10px] font-bold text-slate-500 uppercase text-center min-w-[70px]">{m.substring(0, 3)}.</th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center bg-slate-50 sticky right-0 z-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApartments.map((apt) => {
                  const paidInYear = payments.filter(p => p.apartmentId === apt.id && p.year === selectedYear).length;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                        <div className="flex flex-col">
                          <span className="font-black text-indigo-600 text-sm">{apt.number}</span>
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">{apt.owner}</span>
                        </div>
                      </td>
                      {MONTHS.map((_, idx) => (
                        <td key={idx} className="px-1 py-4 text-center">
                          <button
                            onClick={() => onTogglePayment(apt.id, idx, selectedYear)}
                            className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center mx-auto border-2 ${
                              isPaid(apt.id, idx) 
                              ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-100' 
                              : 'bg-white border-slate-100 text-slate-200 hover:border-indigo-200 hover:text-indigo-400'
                            }`}
                          >
                            <i className={`fas ${isPaid(apt.id, idx) ? 'fa-check text-xs' : 'fa-minus text-[10px]'}`}></i>
                          </button>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l shadow-[-2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${paidInYear === 12 ? 'bg-green-100 text-green-700' : paidInYear > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
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
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Appartement</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Propriétaire</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Cotisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApartments.map((apt) => {
                  const paid = isPaid(apt.id, selectedMonth);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-black text-indigo-600">{apt.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">{apt.owner}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onTogglePayment(apt.id, selectedMonth, selectedYear)}
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black transition-all border-2 ${
                            paid 
                            ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-100' 
                            : 'bg-white border-red-100 text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <i className={`fas ${paid ? 'fa-check-circle' : 'fa-clock'}`}></i>
                          {paid ? 'PAYÉ' : 'ATTENTE'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-slate-800">{apt.monthlyFee.toLocaleString()} <span className="text-[10px] text-slate-400">DH</span></span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {filteredApartments.length === 0 && (
            <div className="p-16 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-2xl text-slate-200"></i>
               </div>
               <p className="text-slate-400 font-bold">Aucun appartement ne correspond à votre recherche.</p>
               <button onClick={() => setSearchTerm('')} className="text-indigo-600 text-xs font-bold mt-2 hover:underline">Effacer la recherche</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
