
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingInfo, Apartment } from '../types';
import { downloadFile } from '../utils/exportUtils';
import { storage } from '../utils/storage';
import { cloudSyncService } from '../services/cloudSyncService';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const deducedUnits = useMemo(() => {
    return (formData.numFloors || 0) * (formData.unitsPerFloor || 0);
  }, [formData.numFloors, formData.unitsPerFloor]);

  const generateApartments = (): Apartment[] => {
    const newApartments: Apartment[] = [];
    let counter = 1;
    for (let f = 0; f < formData.numFloors; f++) {
      for (let u = 1; u <= formData.unitsPerFloor; u++) {
        newApartments.push({
          id: `apt-${counter}`,
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

    if (currentApartmentsCount === 0 || !storage.exists()) {
      apartmentsToSave = generateApartments();
    } else if (currentApartmentsCount !== deducedUnits) {
      if (confirm(`⚠️ ATTENTION : La structure passe de ${currentApartmentsCount} à ${deducedUnits} appartements. Cette opération va ÉCRASER et régénérer tous les appartements (1 à ${deducedUnits}). Voulez-vous continuer ?`)) {
        apartmentsToSave = generateApartments();
      } else {
        return;
      }
    }

    const updatedInfo = { ...formData, totalUnits: deducedUnits, isConfigured: true };
    storage.initialize(updatedInfo, apartmentsToSave || []);
    onSave(updatedInfo, apartmentsToSave);
    
    alert("Configuration réussie ! L'accès complet à l'application est maintenant débloqué.");
    navigate('/');
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
          navigate('/');
        }
      } catch (err) {
        alert('Erreur : Fichier JSON corrompu ou invalide.');
      }
    };
    reader.readAsText(file);
  };

  const handlePushCloud = async () => {
    setIsSyncing(true);
    try {
      const result = await cloudSyncService.pushToCloud(fullData);
      if (result.success) {
        const updatedInfo = { ...formData, lastSyncDate: result.syncDate };
        setFormData(updatedInfo);
        onSave(updatedInfo);
        alert(`Synchronisation réussie !`);
      }
    } catch (error) {
      alert("Erreur lors de la synchronisation cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullCloud = async () => {
    if (!confirm("Restaurer la sauvegarde cloud ?")) return;
    setIsSyncing(true);
    try {
      const result = await cloudSyncService.pullFromCloud();
      if (result) {
        onImportFullDB(result.data);
        alert(`Données restaurées !`);
        navigate('/');
      } else {
        alert("Aucune sauvegarde cloud.");
      }
    } catch (error) {
      alert("Erreur récupération cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportDB = () => {
    const dbString = JSON.stringify(fullData, null, 2);
    downloadFile(dbString, `backup_syndic.json`, 'application/json');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {!buildingInfo.isConfigured && (
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2.5rem] shadow-lg animate-bounce">
          <div className="flex items-center gap-4">
            <i className="fas fa-triangle-exclamation text-amber-600 text-3xl"></i>
            <div>
              <h4 className="font-black text-amber-900">Configuration requise</h4>
              <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mt-1">
                Veuillez configurer la structure de votre immeuble pour débloquer le tableau de bord et la navigation.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-3">
              <i className="fas fa-folder-tree"></i> Gestion des Données
            </h3>
            <p className="text-indigo-100 text-sm mt-2 opacity-80">Initialisez ou restaurez vos données.</p>
          </div>
          <div className="flex gap-3">
            <label className="bg-white/10 hover:bg-white/20 border border-white/30 px-6 py-3 rounded-2xl cursor-pointer transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              <i className="fas fa-file-import"></i> Importer
              <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
            </label>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h4 className="font-black text-slate-800 border-b pb-3 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]">
              <i className="fas fa-layer-group text-indigo-500"></i> Structure de l'Immeuble
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la Résidence</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-bold" placeholder="Ex: Résidence Atlas" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre d'Étages</label>
                <input required type="number" min="1" value={formData.numFloors || ''} onChange={(e) => setFormData({...formData, numFloors: parseInt(e.target.value) || 1})} className="w-full px-5 py-3.5 border rounded-2xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unités par étage</label>
                <input required type="number" min="1" value={formData.unitsPerFloor || ''} onChange={(e) => setFormData({...formData, unitsPerFloor: parseInt(e.target.value) || 1})} className="w-full px-5 py-3.5 border rounded-2xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold" />
              </div>

              <div className="md:col-span-2 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm text-xl border border-amber-200">
                    <i className="fas fa-list-ol"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Aperçu</p>
                    <p className="text-xl font-black text-amber-900">{deducedUnits} Appartements au total</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cotisation par défaut (DH)</label>
                <input required type="number" step="1" value={formData.defaultMonthlyFee || ''} onChange={(e) => setFormData({...formData, defaultMonthlyFee: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3.5 border rounded-2xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-black text-indigo-600" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs">
            <i className="fas fa-save"></i> Enregistrer et Débloquer
          </button>
        </form>
      </div>

      <div className="bg-slate-800 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex gap-5 items-center">
          <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 text-xl">
             <i className="fas fa-download"></i>
          </div>
          <div>
            <h4 className="font-black text-lg">Exporter Backup Physique</h4>
            <p className="text-xs text-slate-400">Téléchargez une sauvegarde locale complète.</p>
          </div>
        </div>
        <button onClick={handleExportDB} className="w-full md:w-auto px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
          Télécharger Backup (.json)
        </button>
      </div>
    </div>
  );
};

export default BuildingSetup;
