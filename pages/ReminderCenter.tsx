
import React, { useState, useMemo } from 'react';
import { Apartment, BuildingInfo, Payment, ReminderLog } from '../types';
import { generateWhatsAppReminderLink, generateDetailedWhatsAppReminder, DEFAULT_TEMPLATES } from '../utils/whatsappUtils';
import { MONTHS } from '../constants';

interface ReminderCenterProps {
  apartments: Apartment[];
  payments: Payment[];
  buildingInfo: BuildingInfo;
  onUpdateBuilding: (info: BuildingInfo) => void;
  reminderHistory: ReminderLog[];
  onAddReminderLog: (log: ReminderLog) => void;
  onClearHistory?: () => void;
}

const ReminderCenter: React.FC<ReminderCenterProps> = ({ 
  apartments, 
  payments, 
  buildingInfo, 
  onUpdateBuilding,
  reminderHistory,
  onAddReminderLog,
  onClearHistory
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'send' | 'config' | 'history'>('send');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la prévisualisation
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'simple' | 'detailed'>('simple');

  const unpaidApartments = useMemo(() => {
    return apartments.filter(apt => 
      !payments.some(p => p.apartmentId === apt.id && p.month === selectedMonth && p.year === selectedYear)
    );
  }, [apartments, payments, selectedMonth, selectedYear]);

  const filteredUnpaid = useMemo(() => {
    return unpaidApartments.filter(apt => 
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      apt.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unpaidApartments, searchTerm]);

  const totalUnpaidAmount = unpaidApartments.reduce((sum, apt) => sum + apt.monthlyFee, 0);
  
  const remindersTodayCount = reminderHistory.filter(log => {
    const today = new Date().toISOString().split('T')[0];
    return log.date.startsWith(today);
  }).length;

  const getLastReminder = (aptId: string) => {
    return [...reminderHistory].reverse().find(log => log.apartmentId === aptId);
  };

  const handleAction = (apt: Apartment, type: 'simple' | 'detailed', url: string | null) => {
    if (!url) return;
    onAddReminderLog({
      id: Date.now().toString(),
      apartmentId: apt.id,
      apartmentNumber: apt.number,
      ownerName: apt.owner,
      date: new Date().toISOString(),
      type
    });
    window.open(url, '_blank');
  };

  // Fonction de rendu de prévisualisation (simulation du moteur de template)
  const renderPreview = (type: 'simple' | 'detailed') => {
    const lang = buildingInfo.reminderLanguage;
    const template = type === 'simple' 
      ? (buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[lang].simple)
      : (buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[lang].detailed);
    
    // Données de test
    const testData = {
      propriétaire: "M. Ahmed Alami",
      immeuble: buildingInfo.name || "Résidence Al Houda",
      mois: MONTHS[selectedMonth],
      annee: selectedYear.toString(),
      montant: "500",
      appartement: "A12",
      nb_mois: "3",
      total_du: "1500",
      details: type === 'detailed' ? (lang === 'ar' ? "⚠️ لديكم أيضاً شهرين غير مؤداة سابقاً.\n" : "⚠️ Vous avez également 2 mois impayés précédemment.\n") : ""
    };

    let rendered = template;
    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    setPreviewContent(rendered);
    setPreviewType(type);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-xl">
            <i className="fas fa-hand-holding-dollar"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retards {MONTHS[selectedMonth]}</p>
            <p className="text-xl font-black text-slate-800">{totalUnpaidAmount.toLocaleString()} DH</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-xl">
            <i className="fas fa-paper-plane"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relances Aujourd'hui</p>
            <p className="text-xl font-black text-slate-800">{remindersTodayCount} <span className="text-sm text-slate-400 font-medium">envoyées</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center text-xl">
            <i className="fas fa-users-slash"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impayés Restants</p>
            <p className="text-xl font-black text-slate-800">{unpaidApartments.length} <span className="text-sm text-slate-400 font-medium">propriétaires</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 sticky top-20 z-20">
        <button onClick={() => setActiveTab('send')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'send' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>ENVOYER RAPPELS</button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>CONFIGURATION MESSAGES</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>HISTORIQUE</button>
      </div>

      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1 bg-slate-100 p-1.5 rounded-xl w-full">
                {MONTHS.map((m, idx) => (
                  <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-1 py-2 rounded-lg text-[9px] font-black transition-all text-center ${selectedMonth === idx ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m.substring(0, 3).toUpperCase()}</button>
                ))}
              </div>
              <div className="relative w-full">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input type="text" placeholder="Filtrer par appartement ou nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
              <div className="divide-y divide-slate-50">
                {filteredUnpaid.length > 0 ? filteredUnpaid.map(apt => {
                  const lastLog = getLastReminder(apt.id);
                  const isRecent = lastLog && (Date.now() - new Date(lastLog.date).getTime() < 7 * 24 * 3600 * 1000);
                  return (
                    <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center">
                          <span className="text-xs font-black">{apt.number}</span>
                          <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">Étage {apt.floor}</span>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{apt.owner} {isRecent && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">Relancé</span>}</p>
                          <p className="text-[10px] text-slate-400 font-bold"><i className="fas fa-phone"></i> {apt.phone || 'Aucun numéro enregistré'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {apt.phone ? (
                          <>
                            <button onClick={() => handleAction(apt, 'simple', generateWhatsAppReminderLink(apt, buildingInfo, false))} className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm"><i className="fab fa-whatsapp"></i> RAPPEL</button>
                            <button onClick={() => handleAction(apt, 'detailed', generateDetailedWhatsAppReminder(apt, buildingInfo, selectedMonth, selectedYear, payments))} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm"><i className="fas fa-file-invoice"></i> DÉTAILS</button>
                          </>
                        ) : <span className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">TÉL. MANQUANT</span>}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-20 text-center"><h4 className="font-black text-slate-400">Toutes les cotisations sont à jour pour ce mois ! 🎉</h4></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Personnalisation des Messages</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configurez le ton et le contenu de vos relances WhatsApp</p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'ar'})} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${buildingInfo.reminderLanguage === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>العربية (AR)</button>
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'fr'})} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${buildingInfo.reminderLanguage === 'fr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Français (FR)</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Template Simple */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <i className="fas fa-comment-dots text-indigo-400"></i> Message Simple (Rappel du mois)
                   </label>
                   <button 
                     onClick={() => renderPreview('simple')} 
                     className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
                   >
                     <i className="fas fa-eye"></i> PRÉVISUALISER
                   </button>
                </div>
                <div className="relative group">
                  <textarea 
                    rows={6} 
                    dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} 
                    value={buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].simple} 
                    onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappTemplate: e.target.value})} 
                    className="w-full p-5 border border-slate-200 rounded-3xl text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner" 
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Auto-sauvegarde activée</div>
                </div>
              </div>

              {/* Template Détaillé */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <i className="fas fa-file-invoice text-indigo-400"></i> Message Détaillé (Impayés cumulés)
                   </label>
                   <button 
                     onClick={() => renderPreview('detailed')} 
                     className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
                   >
                     <i className="fas fa-eye"></i> PRÉVISUALISER
                   </button>
                </div>
                <div className="relative group">
                  <textarea 
                    rows={8} 
                    dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} 
                    value={buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].detailed} 
                    onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappDetailedTemplate: e.target.value})} 
                    className="w-full p-5 border border-slate-200 rounded-3xl text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner" 
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Auto-sauvegarde activée</div>
                </div>
              </div>
           </div>

           <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Guide des Balises Automatiques :</h5>
              <div className="flex flex-wrap gap-2">
                 {[
                   {tag: 'propriétaire', desc: 'Nom complet'},
                   {tag: 'immeuble', desc: 'Nom de la résidence'},
                   {tag: 'mois', desc: 'Mois concerné'},
                   {tag: 'annee', desc: 'Année'},
                   {tag: 'montant', desc: 'Cotisation mensuelle'},
                   {tag: 'appartement', desc: 'Numéro de lot'},
                   {tag: 'details', desc: 'Liste des impayés (si détaillé)'},
                   {tag: 'nb_mois', desc: 'Nombre de mois dus'},
                   {tag: 'total_du', desc: 'Montant cumulé'}
                 ].map(v => (
                   <div key={v.tag} className="bg-white px-3 py-2 rounded-xl border border-indigo-100 flex items-center gap-2 shadow-sm">
                      <code className="text-xs font-black text-indigo-600">{"{" + v.tag + "}"}</code>
                      <span className="text-[10px] text-slate-400 font-bold">({v.desc})</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
           <div className="p-8 border-b flex justify-between items-center">
              <div><h3 className="text-xl font-black text-slate-800">Historique des Communications</h3></div>
              <button 
                onClick={() => { if(confirm("Voulez-vous vraiment vider tout l'historique des rappels ?")) onClearHistory?.(); }} 
                className="text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors px-5 py-2.5 bg-red-50/50 rounded-xl border border-red-100"
              >
                EFFACER TOUT L'HISTORIQUE
              </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 border-b">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Date & Heure</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Appartement</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Propriétaire</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Type de Relance</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {reminderHistory.length > 0 ? [...reminderHistory].reverse().map(log => (
                    <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 text-slate-500 font-medium">{new Date(log.date).toLocaleString('fr-FR')}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs group-hover:bg-indigo-100 transition-colors">{log.apartmentNumber}</span></td>
                      <td className="px-8 py-5 font-bold text-slate-700">{log.ownerName}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          log.type === 'simple' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {log.type === 'simple' ? 'Rappel Simple' : 'Rappel Détaillé'}
                        </span>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">Aucune relance effectuée dans l'historique récent.</td></tr>)}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Modal de Prévisualisation WhatsApp Réaliste */}
      {previewContent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-[#e5ddd5] w-full max-w-sm rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in fade-in duration-300 flex flex-col h-[700px] border-[8px] border-slate-800">
              {/* StatusBar Simulation */}
              <div className="bg-[#075e54] pt-4 px-6 pb-2 text-white flex justify-between items-center text-[10px] font-bold">
                 <span>9:41</span>
                 <div className="flex gap-1.5">
                   <i className="fas fa-signal"></i>
                   <i className="fas fa-wifi"></i>
                   <i className="fas fa-battery-full"></i>
                 </div>
              </div>

              {/* WhatsApp Header Simulation */}
              <div className="bg-[#075e54] p-4 text-white flex items-center gap-3 shadow-md">
                 <button onClick={() => setPreviewContent(null)} className="text-white hover:opacity-70 transition-opacity"><i className="fas fa-chevron-left"></i></button>
                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border border-white/20">
                   <i className="fas fa-user text-xl"></i>
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-bold truncate">M. Ahmed Alami</h4>
                    <p className="text-[9px] opacity-70">En ligne</p>
                 </div>
                 <div className="flex gap-4 text-sm opacity-90">
                    <i className="fas fa-video"></i>
                    <i className="fas fa-phone"></i>
                    <i className="fas fa-ellipsis-v"></i>
                 </div>
              </div>
              
              {/* Chat Area Background with WhatsApp pattern */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col relative" 
                   style={{
                     backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                     backgroundSize: '400px',
                     backgroundRepeat: 'repeat'
                   }}>
                 
                 <div className="self-center bg-white/60 backdrop-blur-sm text-[9px] font-bold text-slate-600 px-3 py-1 rounded-lg uppercase shadow-sm">AUJOURD'HUI</div>
                 
                 <div className={`max-w-[90%] p-4 rounded-2xl shadow-md relative text-xs whitespace-pre-wrap leading-relaxed animate-in slide-in-from-bottom-2 ${
                    buildingInfo.reminderLanguage === 'ar' 
                      ? 'self-end bg-[#dcf8c6] rounded-tr-none' 
                      : 'self-start bg-white rounded-tl-none'
                 }`} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    {previewContent}
                    <div className="flex justify-end items-center gap-1 mt-2">
                       <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                       </span>
                       <span className="text-blue-500 text-[10px]"><i className="fas fa-check-double"></i></span>
                    </div>
                    {/* Speech bubble tail simulation */}
                    <div className={`absolute top-0 w-4 h-4 ${
                       buildingInfo.reminderLanguage === 'ar' 
                         ? '-right-2 bg-[#dcf8c6]' 
                         : '-left-2 bg-white'
                    }`} style={{ clipPath: buildingInfo.reminderLanguage === 'ar' ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                 </div>
              </div>

              {/* WhatsApp Footer Simulation */}
              <div className="bg-slate-100 p-3 flex items-center gap-2 border-t border-slate-200">
                 <i className="fas fa-plus text-indigo-500 text-lg mx-1"></i>
                 <div className="flex-1 bg-white rounded-3xl px-4 py-2 shadow-inner text-slate-400 text-xs italic border border-slate-200">
                    Tapez un message...
                 </div>
                 <i className="fas fa-camera text-indigo-500 text-lg mx-1"></i>
                 <div className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
                    <i className="fas fa-microphone text-xs"></i>
                 </div>
              </div>

              {/* Home Indicator Simulation */}
              <div className="bg-slate-100 pb-2 flex justify-center">
                 <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
              </div>

              <button 
                onClick={() => setPreviewContent(null)} 
                className="absolute top-6 right-8 bg-black/40 hover:bg-black/60 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all z-[110]"
              >
                 <i className="fas fa-times"></i>
              </button>
           </div>
           
           <div className="absolute top-10 text-white font-black text-center text-xl tracking-widest uppercase animate-pulse">
              Aperçu du message {previewType === 'simple' ? 'Rappel' : 'Détaillé'}
           </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCenter;
