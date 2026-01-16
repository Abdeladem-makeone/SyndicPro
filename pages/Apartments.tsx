
import React, { useState } from 'react';
import { Apartment, Payment, BuildingInfo } from '../types';
import { exportToPDF } from '../utils/pdfUtils';

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

const Apartments: React.FC<ApartmentsProps> = ({ apartments, payments, buildingInfo, onUpdate, onAdd, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const currentYear = new Date().getFullYear();

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
    if (sortField !== field) return <i className="fas fa-sort ml-1 text-slate-300"></i>;
    return <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1 text-indigo-600`}></i>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-slate-500">Gérez les informations des appartements et leur structure.</p>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button 
            onClick={() => { setShowAddModal(true); setFormData({}); }}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fas fa-plus"></i> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th 
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('number')}
                >
                  N° App <SortIndicator field="number" />
                </th>
                <th 
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('owner')}
                >
                  Propriétaire <SortIndicator field="owner" />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Statut Payé</th>
                <th 
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('monthlyFee')}
                >
                  Cotisation <SortIndicator field="monthlyFee" />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedApartments.map((apt) => {
                const paidCount = getPaidMonthsCount(apt.id);
                
                return (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-indigo-600">{apt.number}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{apt.owner}</span>
                        <span className="text-xs text-slate-500">{apt.floor === 0 ? 'RDC' : `${apt.floor}ème étage`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        paidCount === 12 
                        ? 'bg-green-100 text-green-700' 
                        : paidCount > 0 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {paidCount} / 12
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{apt.monthlyFee} DH</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(apt)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => onDelete(apt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <i className="fas fa-trash"></i>
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

      {(isEditing || showAddModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">
              {isEditing ? `Modifier l'appartement ${formData.number}` : 'Nouvel Appartement'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Numéro</label>
                <input 
                  type="text" 
                  value={formData.number || ''}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: A1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Étage</label>
                <input 
                  type="number" 
                  value={formData.floor || 0}
                  onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-slate-700">Propriétaire Assigné</label>
                <input 
                  type="text" 
                  value={formData.owner || ''}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Cotisation (DH)</label>
                <input 
                  type="number" 
                  value={formData.monthlyFee || 0}
                  onChange={(e) => setFormData({...formData, monthlyFee: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => { setIsEditing(null); setShowAddModal(false); }}
                className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apartments;
