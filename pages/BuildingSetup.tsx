
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingInfo, Apartment } from '../types';
import { storage } from '../utils/storage';

interface BuildingSetupProps {
  buildingInfo: BuildingInfo;
  onSave: (info: BuildingInfo, apartments?: Apartment[]) => void;
  onImportFullDB: (data: any) => void;
  fullData: any;
  currentApartmentsCount: number;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BuildingSetup: React.FC<BuildingSetupProps> = ({ 
  buildingInfo, 
  onSave, 
  onNotify
}) => {
  const [formData, setFormData] = useState<BuildingInfo>(buildingInfo);
  const [activeTab, setActiveTab] = useState<'building' | 'syndic' | 'owners'>('building');
  const [loading, setLoading] = useState(false);
  const [virtualFiles, setVirtualFiles] = useState<{name: string, size: number}[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setVirtualFiles(storage.getVirtualFiles());
  }, []);

  const deducedUnits = useMemo(() => {
    return (formData.numFloors || 0) * (formData.unitsPerFloor || 0);
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
        } as Apartment);
        counter++;
      }
    }
    return newApartments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'building') {
      if (deducedUnits <= 0) return onNotify?.("Structure invalide", "error");
      
      setLoading(true);
      setTimeout(() => {
        const apartmentsToSave = generateApartments();
        const updatedInfo = { ...formData, totalUnits: deducedUnits, isConfigured: true };
        onSave(updatedInfo, apartmentsToSave);
        setLoading(false);
        setVirtualFiles(storage.getVirtualFiles());
        onNotify?.(`Base initialisée avec ${deducedUnits} unités`);
        navigate('/');
      }, 1200);
    } else {
      onSave(formData);
    }
  };

  const handleExportJSON = () => {
    const data = storage.getFullExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_syndicpro_${formData.name.replace(/\s+/g, '_') || 'global'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("Sauvegarde JSON exportée", "success");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importFullData(content)) {
        onNotify?.("Importation réussie", "success");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        onNotify?.("Échec de l'import : format invalide", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleFormat = () => {
    if (confirm("⚠️ ATTENTION : Vous allez supprimer toutes les données locales. Continuer ?")) {
      storage.formatStorage();
      onNotify?.("Toutes les données ont été effacées", "info");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const toggleField = (field: keyof BuildingInfo) => {
    const updated = { ...formData, [field]: !formData[field] };
    setFormData(updated);
    if (formData.isConfigured) {
        onSave(updated);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {loading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[5000] flex flex-col items-center justify-center text-white">
           <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
           <p className="font-bold uppercase tracking-widest text-[10px]">Initialisation des données...</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuration Système</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestion de l'infrastructure et des sauvegardes</p>
         </div>
         <div className="flex gap-3">
            <button onClick={handleExportJSON} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-2 transition-all border border-slate-200 text-[10px] font-black uppercase tracking-widest">
               <i className="fas fa-file-export"></i> Exporter
            </button>
            <div className="relative">
               <input type="file" accept=".json" onChange={handleImportJSON} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
               <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all shadow-md text-[10px] font-black uppercase tracking-widest">
                  <i className="fas fa-file-import"></i> Importer
               </button>
            </div>
         </div>
      </div>

      {/* Navigation Onglets */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveTab('building')} 
           className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'building' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
         >
           <i className="fas fa-building mr-2"></i> Immeuble
         </button>
         <button 
           onClick={() => setActiveTab('syndic')} 
           className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'syndic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
         >
           <i className="fas fa-user-shield mr-2"></i> Syndic
         </button>
         <button 
           onClick={() => setActiveTab('owners')} 
           className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'owners' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
         >
           <i className="fas fa-users-gear mr-2"></i> Propriétaires
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                 {activeTab === 'building' ? 'Structure du Bâtiment' : activeTab === 'syndic' ? 'Informations du Syndic' : 'Droits & Visibilité'}
               </h3>
               <i className={`fas ${activeTab === 'building' ? 'fa-building' : activeTab === 'syndic' ? 'fa-id-card' : 'fa-lock'} text-slate-400`}></i>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {activeTab === 'building' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la Résidence</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold outline-none transition-all" placeholder="Ex: Résidence Atlas" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre d'Étages</label>
                      <input required type="number" min="1" value={formData.numFloors} onChange={(e) => setFormData({...formData, numFloors: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unités par étage</label>
                      <input required type="number" min="1" value={formData.unitsPerFloor} onChange={(e) => setFormData({...formData, unitsPerFloor: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none" />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <i className="fas fa-money-bill-transfer text-sm"></i>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Cotisation par défaut</label>
                        <p className="text-[9px] text-indigo-400 font-bold uppercase">Appliqué aux nouveaux appartements</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-white rounded-lg border border-indigo-200 p-1">
                      <input required type="number" value={formData.defaultMonthlyFee} onChange={(e) => setFormData({...formData, defaultMonthlyFee: parseInt(e.target.value) || 0})} className="w-20 px-2 py-2 text-indigo-700 font-black text-center outline-none text-sm" />
                      <span className="px-3 text-[10px] font-black text-indigo-400">DH</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white text-xl border border-white/10"><i className="fas fa-layer-group"></i></div>
                        <div>
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Total à générer</span>
                           <span className="text-xl font-black text-white">{deducedUnits} Appartements</span>
                        </div>
                     </div>
                     <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                        Initialiser la base
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'syndic' && (
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de Contact Syndic</label>
                      <div className="relative">
                         <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                         <input type="text" value={formData.syndicContactNumber || ''} onChange={(e) => setFormData({...formData, syndicContactNumber: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none" placeholder="Ex: 06 00 00 00 00" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clé API WhatsApp (Provider)</label>
                      <div className="relative">
                         <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                         <input type="password" value={formData.whatsappApiKey || ''} onChange={(e) => setFormData({...formData, whatsappApiKey: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none" placeholder="••••••••••••••••" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de Communication (Envois)</label>
                      <div className="relative">
                         <i className="fab fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                         <input type="text" value={formData.whatsappSenderNumber || ''} onChange={(e) => setFormData({...formData, whatsappSenderNumber: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none" placeholder="Numéro utilisé pour OTP et rappels" />
                      </div>
                   </div>

                   <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                           <i className="fas fa-lock text-sm"></i>
                         </div>
                         <div>
                           <label className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Mot de passe Administrateur</label>
                           <p className="text-[9px] text-rose-400 font-bold uppercase">Sécurise l'accès à cet espace</p>
                         </div>
                      </div>
                      <input type="password" value={formData.adminPassword || ''} onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} className="w-full px-4 py-3 border border-rose-200 rounded-xl bg-white font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nouveau mot de passe (laisser vide pour 'admin')" />
                   </div>

                   <button type="submit" className="w-full py-4 bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-xl">
                      Sauvegarder les infos Syndic
                   </button>
                </div>
              )}

              {activeTab === 'owners' && (
                <div className="space-y-6">
                  {/* Toggle Global */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.ownerInterfaceEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                        <i className={`fas ${formData.ownerInterfaceEnabled ? 'fa-unlock' : 'fa-lock'} text-sm`}></i>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Accès Propriétaire (Login)</label>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Permettre aux résidents de se connecter</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => toggleField('ownerInterfaceEnabled')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.ownerInterfaceEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.ownerInterfaceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {formData.ownerInterfaceEnabled && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Afficher Trésorerie */}
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.ownerShowBalance ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-300'}`}>
                             <i className="fas fa-sack-dollar"></i>
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Barre de Trésorerie</label>
                             <p className="text-[9px] text-slate-400 font-medium">Afficher le solde global de la résidence</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => toggleField('ownerShowBalance')} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.ownerShowBalance ? 'bg-teal-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.ownerShowBalance ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Afficher Registre des dépenses */}
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.ownerShowExpenseRegister ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                             <i className="fas fa-list-check"></i>
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Registre des Dépenses</label>
                             <p className="text-[9px] text-slate-400 font-medium">Afficher le détail des factures payées</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => toggleField('ownerShowExpenseRegister')} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.ownerShowExpenseRegister ? 'bg-amber-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.ownerShowExpenseRegister ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Autoriser Création Ops */}
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.ownerCanCreateOps ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                             <i className="fas fa-plus-circle"></i>
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Création Projets / Réclamations</label>
                             <p className="text-[9px] text-slate-400 font-medium">Permettre aux propriétaires de créer des entrées</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => toggleField('ownerCanCreateOps')} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.ownerCanCreateOps ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.ownerCanCreateOps ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!formData.ownerInterfaceEnabled && (
                    <div className="py-10 text-center opacity-40">
                      <i className="fas fa-user-lock text-4xl mb-3"></i>
                      <p className="text-xs font-bold uppercase tracking-widest">L'interface est désactivée.</p>
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4">
                    Sauvegarder les droits
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <i className="fas fa-database text-indigo-600 text-xs"></i>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Fichiers Locaux</span>
                 </div>
                 <button onClick={handleFormat} className="text-[9px] font-black text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors border border-rose-100 uppercase tracking-tighter">
                    Vider le cache
                 </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-2 no-scrollbar">
                 {virtualFiles.map(file => (
                    <div key={file.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                       <div className="flex items-center gap-3">
                          <i className="fas fa-file-code text-slate-400 text-sm"></i>
                          <div className="min-w-0">
                             <p className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Stream JSON</p>
                          </div>
                       </div>
                       <span className="text-[9px] font-black text-slate-500">{file.size.toFixed(1)} KB</span>
                    </div>
                 ))}
                 {virtualFiles.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                      <i className="fas fa-box-open text-3xl text-slate-300 mb-3"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun fichier</p>
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase mb-2">
                    <span className="text-slate-500">Intégrité Stockage</span>
                    <span className="text-emerald-600">Local-Only (RGPD)</span>
                 </div>
                 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[100%]"></div>
                 </div>
              </div>
           </div>

           <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-amber-700 mb-3">
                 <i className="fas fa-shield-halved text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Sécurité & Vie Privée</span>
              </div>
              <p className="text-[11px] text-amber-800/70 font-medium leading-relaxed">
                Toutes les données sont conservées uniquement sur cet appareil. Pour éviter toute perte, effectuez régulièrement des exports JSON.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingSetup;
