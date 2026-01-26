
import React, { useState, useEffect, useMemo } from 'react';
import { Apartment, ProfileRequest } from '../types';
import { exportToPDF } from '../utils/pdfUtils';
import anime from 'animejs';

interface OwnersProps {
  apartments: Apartment[];
  onUpdate: (apartment: Apartment) => void;
  profileRequests?: ProfileRequest[];
  onHandleProfileRequest?: (requestId: string, approved: boolean) => void;
}

type ViewMode = 'grid' | 'list' | 'floors';

const Owners: React.FC<OwnersProps> = ({ apartments, onUpdate, profileRequests = [], onHandleProfileRequest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fix: cast anime to any
  // Animation d'entrée lors du changement de vue ou de recherche
  useEffect(() => {
    (anime as any)({
      targets: '.owner-item',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(40),
      easing: 'easeOutQuart',
      duration: 500
    });
  }, [viewMode, searchTerm]);

  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apartments, searchTerm]);

  const apartmentsByFloor = useMemo(() => {
    const floors: Record<number, Apartment[]> = {};
    filteredApartments.forEach(apt => {
      if (!floors[apt.floor]) floors[apt.floor] = [];
      floors[apt.floor].push(apt);
    });
    return Object.entries(floors).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [filteredApartments]);

  const handleEdit = (apt: Apartment) => {
    setEditingId(apt.id);
    setFormData(apt);
  };

  const handleSave = () => {
    if (editingId && formData) {
      onUpdate(formData as Apartment);
      setEditingId(null);
    }
  };

  const handleExportPDF = () => {
    const headers = ['N° Appartement', 'Étage', 'Propriétaire', 'Téléphone'];
    const rows = filteredApartments.map(apt => [
      apt.number,
      apt.floor === 0 ? 'RDC' : `${apt.floor}`,
      apt.owner,
      apt.phone || 'Non renseigné'
    ]);
    exportToPDF('Annuaire des Propriétaires', headers, rows, 'annuaire_proprietaires');
  };

  return (
    <div className="space-y-10">
      {/* Notifications - Demandes de changement */}
      {profileRequests.filter(r => r.status === 'pending').length > 0 && onHandleProfileRequest && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-amber-100">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-amber-200">
                 <i className="fas fa-bell"></i>
              </div>
              <div>
                 <h3 className="text-xl font-black text-amber-900 tracking-tight">Demandes de modification</h3>
                 <p className="text-xs text-amber-700 font-bold uppercase tracking-widest opacity-80">{profileRequests.filter(r => r.status === 'pending').length} demande(s) en attente</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Appartement {req.apartmentNumber} - {req.ownerName}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-slate-400 line-through">{req.currentPhone}</span>
                         <i className="fas fa-arrow-right text-amber-500 text-[10px]"></i>
                         <span className="text-sm font-black text-slate-800">{req.newPhone}</span>
                      </div>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => onHandleProfileRequest(req.id, true)} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-md shadow-green-100">Confirmer</button>
                      <button onClick={() => onHandleProfileRequest(req.id, false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">Refuser</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Header & Filtres */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Annuaire Copropriété</h2>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 mt-4 shadow-sm w-fit">
            <button onClick={() => setViewMode('grid')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
              <i className="fas fa-th-large mr-2"></i> Cartes
            </button>
            <button onClick={() => setViewMode('list')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
              <i className="fas fa-list mr-2"></i> Liste
            </button>
            <button onClick={() => setViewMode('floors')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'floors' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
              <i className="fas fa-layer-group mr-2"></i> Par Étage
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-80">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-8 py-3.5 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest">
            <i className="fas fa-file-pdf text-sm"></i> PDF
          </button>
        </div>
      </div>

      {/* Rendu des Vues */}
      <div className="w-full min-h-[400px]">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApartments.map((apt) => (
              <div key={apt.id} className="owner-item opacity-0 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full group">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Appartement {apt.number}</span>
                  <button onClick={() => handleEdit(apt)} className="text-slate-400 hover:text-indigo-600 p-2.5 hover:bg-indigo-50 rounded-2xl transition-all"><i className="fas fa-user-pen"></i></button>
                </div>
                <div className="space-y-6 flex-1 flex flex-col">
                  <div>
                     <h3 className="font-black text-slate-800 text-xl truncate mb-1 group-hover:text-indigo-600 transition-colors">{apt.owner}</h3>
                     <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Propriétaire Principal</p>
                  </div>
                  <div className="space-y-4 flex-1 pt-2">
                    <div className="flex items-center gap-4 text-sm"><div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><i className="fab fa-whatsapp text-lg"></i></div><span className="font-black text-slate-700">{apt.phone || 'Non renseigné'}</span></div>
                    <div className="flex items-center gap-4 text-sm"><div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><i className="fas fa-envelope text-sm"></i></div><span className="truncate font-black text-slate-700">{apt.email || 'Non renseigné'}</span></div>
                  </div>
                  <div className="pt-6 mt-auto border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    <span className="flex items-center gap-2"><i className="fas fa-layer-group text-indigo-400"></i> ÉTAGE {apt.floor === 0 ? 'RDC' : apt.floor}</span>
                    <span className="flex items-center gap-2"><i className="fas fa-coins text-amber-400"></i> {apt.monthlyFee} DH</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Appt</th>
                    <th className="px-8 py-5">Propriétaire</th>
                    <th className="px-8 py-5">Contact</th>
                    <th className="px-8 py-5">Cotisation</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredApartments.map(apt => (
                    <tr key={apt.id} className="owner-item opacity-0 hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 font-black text-indigo-600">#{apt.number}</td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{apt.owner}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase">Étage {apt.floor === 0 ? 'RDC' : apt.floor}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fab fa-whatsapp text-emerald-500"></i> {apt.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-800 text-sm">{apt.monthlyFee} DH</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleEdit(apt)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i className="fas fa-edit"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'floors' && (
          <div className="space-y-12">
            {apartmentsByFloor.map(([floor, floorApts]) => (
              <div key={floor} className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-px flex-1 bg-slate-200"></div>
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                     {parseInt(floor) === 0 ? 'Rez-de-chaussée' : `Étage ${floor}`}
                   </h4>
                   <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {floorApts.map(apt => (
                     <div key={apt.id} className="owner-item opacity-0 bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-300 transition-all cursor-pointer group" onClick={() => handleEdit(apt)}>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black transition-colors">{apt.number}</div>
                        <div className="min-w-0">
                           <p className="font-bold text-slate-800 text-xs truncate">{apt.owner}</p>
                           <p className="text-[9px] font-black text-emerald-600 uppercase truncate">{apt.phone || 'Sans contact'}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredApartments.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <i className="fas fa-user-slash text-3xl"></i>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun résultat trouvé.</p>
          </div>
        )}
      </div>

      {/* Modal Edition (Standard) */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Profil Propriétaire</h3>
            <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Propriétaire</label>
                  <input type="text" value={formData.owner || ''} onChange={(e) => setFormData({...formData, owner: e.target.value})} className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone WhatsApp</label>
                  <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 border border-slate-100 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Sauvegarder</button>
              <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Owners;
