
import React, { useState, useMemo } from 'react';
import { BuildingInfo, Apartment } from '../types';
import { downloadFile } from '../utils/exportUtils';
import { requestNotificationPermission } from '../utils/notificationUtils';

interface BuildingSetupProps {
  buildingInfo: BuildingInfo;
  onSave: (info: BuildingInfo, apartments?: Apartment[]) => void;
  onImportFullDB: (data: any) => void;
  fullData: any;
  currentApartmentsCount: number;
}

const BuildingSetup: React.FC<BuildingSetupProps> = ({ 
  buildingInfo, 
  onSave, 
  onImportFullDB, 
  fullData,
  currentApartmentsCount 
}) => {
  const [formData, setFormData] = useState<BuildingInfo>(buildingInfo);

  const deducedUnits = useMemo(() => {
    return formData.numFloors * formData.unitsPerFloor;
  }, [formData.numFloors, formData.unitsPerFloor]);

  const generateApartments = (): Apartment[] => {
    const newApartments: Apartment[] = [];
    let counter = 1;
    for (let f = 0; f < formData.numFloors; f++) {
      for (let u = 1; u <= formData.unitsPerFloor; u++) {
        newApartments.push({
          id: `apt-${counter}-${Date.now()}`,
          number: counter.toString(),
          owner: 'À renseigner',
          shares: 100,
          monthlyFee: formData.defaultMonthlyFee,
          floor: f,
          phone: '',
          email: ''
        });
        counter++;
      }
    }
    return newApartments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let apartmentsToSave: Apartment[] | undefined = undefined;

    if (currentApartmentsCount === 0) {
      apartmentsToSave = generateApartments();
    } else if (currentApartmentsCount !== deducedUnits) {
      if (confirm(`Attention : La nouvelle structure comporte ${deducedUnits} lots alors que vous en avez actuellement ${currentApartmentsCount}. Voulez-vous régénérer tous les lots avec une numérotation séquentielle (1, 2, 3...) ?`)) {
        apartmentsToSave = generateApartments();
      }
    }

    onSave({ 
      ...formData, 
      totalUnits: deducedUnits, 
      isConfigured: true 
    }, apartmentsToSave);
  };

  const toggleNotifications = async () => {
    if (!formData.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setFormData({ ...formData, notificationsEnabled: true });
      } else {
        alert("Les notifications ont été refusées par le navigateur.");
      }
    } else {
      setFormData({ ...formData, notificationsEnabled: false });
    }
  };

  const handleExportDB = () => {
    const dbString = JSON.stringify(fullData, null, 2);
    downloadFile(dbString, `backup_syndicpro_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('Importer cette base de données écrasera vos données actuelles. Continuer ?')) {
          onImportFullDB(json);
          alert('Données importées avec succès !');
        }
      } catch (err) {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-city"></i> Configuration de l'Immeuble
            </h3>
            <p className="text-indigo-100 text-sm mt-1">Gérez la structure et les préférences de votre copropriété.</p>
          </div>
          <i className="fas fa-building text-4xl text-indigo-400 opacity-50"></i>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 uppercase text-xs tracking-widest">
              <i className="fas fa-layer-group text-indigo-500"></i> Structure Physique
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Nom de la Résidence</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  placeholder="Ex: Résidence Al Baraka"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nombre d'étages (incluant RDC)</label>
                <div className="relative">
                  <i className="fas fa-stairs absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.numFloors || ''}
                    onChange={(e) => setFormData({...formData, numFloors: parseInt(e.target.value) || 1})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Appartements par étage</label>
                <div className="relative">
                  <i className="fas fa-door-open absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.unitsPerFloor || ''}
                    onChange={(e) => setFormData({...formData, unitsPerFloor: parseInt(e.target.value) || 1})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="md:col-span-2 p-4 bg-indigo-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <i className="fas fa-calculator"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Lots</p>
                    <p className="text-lg font-black text-indigo-900">{deducedUnits} Appartements (1 à {deducedUnits})</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Cotisation Mensuelle (Défaut)</label>
                <div className="relative">
                  <i className="fas fa-money-bill-wave absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.defaultMonthlyFee || ''}
                    onChange={(e) => setFormData({...formData, defaultMonthlyFee: parseFloat(e.target.value) || 0})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2 uppercase text-xs tracking-widest">
              <i className="fas fa-cog text-indigo-500"></i> Préférences & Alertes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div 
                 className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${formData.notificationsEnabled ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                 onClick={toggleNotifications}
               >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.notificationsEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                       <i className="fas fa-bell"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Notifications Bureau</p>
                      <p className="text-[10px] text-slate-500">Alertes sur les impayés et réclamations</p>
                    </div>
                  </div>
               </div>

               <div 
                 className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${formData.autoRemindersEnabled ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                 onClick={() => setFormData({...formData, autoRemindersEnabled: !formData.autoRemindersEnabled})}
               >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.autoRemindersEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                       <i className="fas fa-robot"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Alertes Dashboard</p>
                      <p className="text-[10px] text-slate-500">Bannières de rappel intelligentes</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col gap-4">
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              <i className="fas fa-check-circle"></i>
              Valider et Générer les Lots (1, 2, 3...)
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
             <i className="fas fa-database text-xl"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Gestion de la Base de Données</h4>
            <p className="text-xs text-slate-500">Exportez ou restaurez votre base complète au format JSON.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-all text-xs text-center border">
            <i className="fas fa-file-import mr-2"></i> Restaurer
            <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
          </label>
          <button 
            type="button"
            onClick={handleExportDB}
            className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all text-xs border border-slate-900 shadow-md"
          >
            <i className="fas fa-file-export mr-2"></i> Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingSetup;
