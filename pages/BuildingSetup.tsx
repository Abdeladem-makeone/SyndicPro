
import React, { useState, useMemo } from 'react';
import { BuildingInfo } from '../types';
import { downloadFile } from '../utils/exportUtils';
import { DEFAULT_TEMPLATES } from '../utils/whatsappUtils';

interface BuildingSetupProps {
  buildingInfo: BuildingInfo;
  onSave: (info: BuildingInfo) => void;
  onImportFullDB: (data: any) => void;
  fullData: any;
}

const BuildingSetup: React.FC<BuildingSetupProps> = ({ buildingInfo, onSave, onImportFullDB, fullData }) => {
  const [formData, setFormData] = useState<BuildingInfo>(buildingInfo);

  const deducedUnits = useMemo(() => {
    return formData.numFloors * formData.unitsPerFloor;
  }, [formData.numFloors, formData.unitsPerFloor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      totalUnits: deducedUnits, // Mise à jour auto du total
      isConfigured: true 
    });
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
              <i className="fas fa-city"></i> Structure de l'Immeuble
            </h3>
            <p className="text-indigo-100 text-sm mt-1">Configurez les étages et les appartements.</p>
          </div>
          <i className="fas fa-building text-4xl text-indigo-400 opacity-50"></i>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <i className="fas fa-layer-group text-indigo-500"></i> Configuration Géométrique
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
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Calculé</p>
                    <p className="text-lg font-black text-indigo-900">{deducedUnits} Appartements</p>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-500 italic max-w-[200px] text-right">
                  Les appartements seront automatiquement attribués aux étages lors de la validation.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Cotisation Mensuelle (Par défaut)</label>
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

          <div className="pt-6 border-t flex flex-col gap-4">
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
            >
              <i className="fas fa-save"></i>
              Générer et Enregistrer la Structure
            </button>
            <p className="text-[10px] text-slate-400 text-center italic">
              Attention : modifier le nombre d'appartements pourrait réinitialiser certains propriétaires si les numéros changent.
            </p>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
             <i className="fas fa-database text-xl"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Migration & Backup</h4>
            <p className="text-xs text-slate-500">Sauvegardez l'intégralité de vos données dans un fichier JSON.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-all text-sm text-center">
            <i className="fas fa-file-import mr-2"></i> Importer
            <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
          </label>
          <button 
            type="button"
            onClick={handleExportDB}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all text-sm"
          >
            <i className="fas fa-file-export mr-2"></i> Exporter
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingSetup;
