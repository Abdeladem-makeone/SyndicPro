
import React, { useState } from 'react';
import { Apartment } from '../types';

interface OwnersProps {
  apartments: Apartment[];
  onUpdate: (apartment: Apartment) => void;
}

const Owners: React.FC<OwnersProps> = ({ apartments, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Apartment>>({});

  // Filtrage simple par nom de propriétaire ou numéro d'appartement
  const filteredApartments = apartments.filter(apt => 
    apt.owner.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Contacts</h2>
          <p className="text-slate-500 text-sm">Chaque appartement dispose de ses propres coordonnées de contact.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Rechercher lot ou nom..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApartments.map((apt) => (
          <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
                {apt.number}
              </span>
              <button 
                onClick={() => handleEdit(apt)}
                className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-all"
              >
                <i className="fas fa-edit"></i>
              </button>
            </div>

            {editingId === apt.id ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom du Propriétaire</label>
                  <input 
                    type="text" 
                    value={formData.owner || ''}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Téléphone WhatsApp</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">Enregistrer</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-200">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                   <h3 className="font-bold text-slate-800 text-lg truncate mb-1">{apt.owner}</h3>
                   <p className="text-[10px] text-slate-400 font-semibold uppercase">Propriétaire Lot {apt.number}</p>
                </div>
                
                <div className="space-y-3 flex-1 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <i className="fas fa-phone text-xs"></i>
                    </div>
                    <span className="font-medium">{apt.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <i className="fas fa-envelope text-xs"></i>
                    </div>
                    <span className="truncate font-medium">{apt.email || 'Non renseigné'}</span>
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Étage: {apt.floor === 0 ? 'RDC' : apt.floor}</span>
                  <span>Cotisation: {apt.monthlyFee} DH</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredApartments.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <i className="fas fa-user-slash text-2xl"></i>
            </div>
            <p className="text-slate-400">Aucun appartement ou propriétaire trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Owners;
