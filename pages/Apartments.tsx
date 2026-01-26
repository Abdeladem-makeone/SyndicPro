
import React, { useState, useEffect } from 'react';
import { Apartment, Payment, BuildingInfo } from '../types';
import { exportToPDF } from '../utils/pdfUtils';
import anime from 'animejs';

interface ApartmentsProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onUpdate: (apartment: Apartment) => void;
  onAdd: (apartment: Apartment) => void;
  onDelete: (id: string) => void;
}

type SortField = 'number' | 'owner' | 'monthlyFee';
type SortOrder = 'asc' | 'desc';

const Apartments: React.FC<ApartmentsProps> = ({ 
  apartments, payments, buildingInfo, onUpdate, onAdd, onDelete 
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    (anime as any)({
      targets: '.apt-row',
      translateX: [-20, 0],
      opacity: [0, 1],
      delay: anime.stagger(50),
      easing: 'easeOutQuad',
      duration: 600
    });
  }, [apartments, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedApartments = [...apartments].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'number') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const handleEditClick = (apt: Apartment) => {
    setIsEditing(apt.id);
    setFormData(apt);
  };

  const handleSave = () => {
    if (isEditing) {
      onUpdate(formData as Apartment);
      setIsEditing(null);
    } else {
      const newApt = { ...formData, id: Date.now().toString() } as Apartment;
      onAdd(newApt);
      setShowAddModal(false);
    }
    setFormData({});
  };

  const getPaidMonthsCount = (aptId: string) => {
    return payments.filter(p => p.apartmentId === aptId && p.year === currentYear).length;
  };

  const handleExportPDF = () => {
    const headers = ['Appartement', 'Propriétaire', 'Étage', 'Mois Payés', 'Cotisation'];
    const rows = sortedApartments.map(apt => [
      apt.number,
      apt.owner,
      apt.floor,
      `${getPaidMonthsCount(apt.id)} / 12`,
      `${apt.monthlyFee} DH`
    ]);
    exportToPDF('Liste des Appartements et Propriétaires', headers, rows, 'liste_apartements');
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <i className="fas fa-sort ml-2 text-slate-200"></i>;
    return <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-2 text-indigo-600`}></i>;
  };

  return (
    <div className="space-y-10 w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestion du Parc</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configuration technique des appartements</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-slate-200 text-slate-500 px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i> Exporter PDF
          </button>
          <button 
            onClick={() => { setShowAddModal(true); setFormData({}); }}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 text-[11px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-plus"></i> Nouvel Appartement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th 
                  className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('number')}
                >
                  Appartement <SortIndicator field="number" />
                </th>
                <th 
                  className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('owner')}
                >
                  Propriétaire <SortIndicator field="owner" />
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Paiements {currentYear}</th>
                <th 
                  className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('monthlyFee')}
                >
                  Cotisation <SortIndicator field="monthlyFee" />
                </th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedApartments.map((apt) => {
                const paidCount = getPaidMonthsCount(apt.id);
                
                return (
                  <tr key={apt.id} className="apt-row hover:bg-slate-50/50 transition-colors group opacity-0">
                    <td className="px-8 py-6">
                       <span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 font-black flex items-center justify-center text-sm border border-slate-100">{apt.number}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-[13px] tracking-tight">{apt.owner}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{apt.floor === 0 ? 'Rez-de-chaussée' : `${apt.floor}ème étage`}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${
                          paidCount === 12 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : paidCount > 0 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {paidCount} / 12 MOIS
                        </span>
                        <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                           <div className={`h-full ${paidCount === 12 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width: `${(paidCount/12)*100}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-800 text-sm whitespace-nowrap">{apt.monthlyFee.toLocaleString()} DH</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(apt)}
                          className="w-10 h-10 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-50"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => { if(confirm('Supprimer cet appartement ?')) onDelete(apt.id); }}
                          className="w-10 h-10 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm border border-rose-50"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* (Keep same Modal logic but ensure classes match the theme) */}
      {(isEditing || showAddModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full p-10 space-y-10 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
              {isEditing ? `Modifier Appartement ${formData.number}` : 'Nouvel Appartement'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro d'Unité</label>
                <input type="text" value={formData.number || ''} onChange={(e) => setFormData({...formData, number: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localisation Étage</label>
                <input type="number" value={formData.floor || 0} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identité du Propriétaire</label>
                <input type="text" value={formData.owner || ''} onChange={(e) => setFormData({...formData, owner: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button onClick={() => { setIsEditing(null); setShowAddModal(false); }} className="flex-1 px-4 py-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-[2] px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Valider les données</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
