
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
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<'send' | 'config' | 'history'>('send');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const renderPreview = (type: 'simple' | 'detailed') => {
    const lang = buildingInfo.reminderLanguage;
    const template = type === 'simple' 
      ? (buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[lang].simple)
      : (buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[lang].detailed);
    
    const testData = {
      propriétaire: "M. Ahmed Alami",
      immeuble: buildingInfo.name || "Résidence Al Houda",
      mois: MONTHS[selectedMonth],
      annee: selectedYear.toString(),
      montant: "500",
      appartement: "12",
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">
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

      <div className="flex bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 sticky top-0 z-50">
        <button onClick={() => setActiveTab('send')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'send' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Envoyer</button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Configuration</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Historique</button>
      </div>

      {activeTab === 'send' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
              <div className="flex bg-slate-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar gap-1">
                {MONTHS.map((m, idx) => (
                  <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all text-center whitespace-nowrap min-w-[60px] ${selectedMonth === idx ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m.substring(0, 3).toUpperCase()}</button>
                ))}
              </div>
              <div className="relative w-full">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input type="text" placeholder="Rechercher par lot ou nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
              <div className="divide-y divide-slate-50">
                {filteredUnpaid.length > 0 ? filteredUnpaid.map(apt => {
                  const lastLog = getLastReminder(apt.id);
                  const isRecent = lastLog && (Date.now() - new Date(lastLog.date).getTime() < 3 * 24 * 3600 * 1000);
                  return (
                    <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center">
                          <span className="text-xs font-black">{apt.number}</span>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{apt.owner} {isRecent && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-tighter">Relancé il y a peu</span>}</p>
                          <p className="text-[10px] text-slate-400 font-bold"><i className="fas fa-phone"></i> {apt.phone || 'Aucun numéro enregistré'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {apt.phone ? (
                          <>
                            <button onClick={() => handleAction(apt, 'simple', generateWhatsAppReminderLink(apt, buildingInfo, false))} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-black hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest"><i className="fab fa-whatsapp"></i> Rappel</button>
                            <button onClick={() => handleAction(apt, 'detailed', generateDetailedWhatsAppReminder(apt, buildingInfo, selectedMonth, selectedYear, payments))} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest"><i className="fas fa-list-check"></i> Dossier</button>
                          </>
                        ) : <span className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">TÉLÉPHONE MANQUANT</span>}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-20 text-center"><h4 className="font-black text-slate-400">Tout est à jour pour ce mois ! 🏘️</h4></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Configuration Messages</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Formatage automatique des envois WhatsApp</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl border">
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'ar'})} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${buildingInfo.reminderLanguage === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>العربية</button>
                 <button onClick={() => onUpdateBuilding({...buildingInfo, reminderLanguage: 'fr'})} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${buildingInfo.reminderLanguage === 'fr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Français</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rappel Simple</label>
                   <button onClick={() => renderPreview('simple')} className="text-indigo-600 text-[10px] font-black flex items-center gap-1"><i className="fas fa-eye"></i> APERÇU</button>
                </div>
                <textarea rows={6} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} value={buildingInfo.whatsappTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].simple} onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappTemplate: e.target.value})} className="w-full p-4 border rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rappel Détaillé (Dossier)</label>
                   <button onClick={() => renderPreview('detailed')} className="text-indigo-600 text-[10px] font-black flex items-center gap-1"><i className="fas fa-eye"></i> APERÇU</button>
                </div>
                <textarea rows={6} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'} value={buildingInfo.whatsappDetailedTemplate || DEFAULT_TEMPLATES[buildingInfo.reminderLanguage].detailed} onChange={(e) => onUpdateBuilding({...buildingInfo, whatsappDetailedTemplate: e.target.value})} className="w-full p-4 border rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
           <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Historique des envois</h3>
              <button onClick={() => { if(confirm("Vider l'historique ?")) onClearHistory?.(); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-3 py-2 bg-red-50 rounded-xl">Vider</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 border-b">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Lot</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Propriétaire</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Type</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {reminderHistory.length > 0 ? [...reminderHistory].reverse().map(log => (
                    <tr key={log.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{new Date(log.date).toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-4"><span className="font-black text-indigo-600">{log.apartmentNumber}</span></td>
                      <td className="px-6 py-4 font-bold">{log.ownerName}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${log.type === 'simple' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{log.type}</span>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Aucun envoi enregistré.</td></tr>)}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {previewContent && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-[#e5ddd5] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col h-[600px] border-[6px] border-slate-800">
              <div className="bg-[#075e54] p-4 text-white flex items-center gap-3">
                 <button onClick={() => setPreviewContent(null)}><i className="fas fa-chevron-left"></i></button>
                 <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                 <div className="flex-1">
                    <h4 className="text-xs font-bold">Aperçu WhatsApp</h4>
                    <p className="text-[8px] opacity-70">En ligne</p>
                 </div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: '300px' }}>
                 <div className={`max-w-[85%] p-3 rounded-xl shadow-sm text-xs whitespace-pre-wrap ${buildingInfo.reminderLanguage === 'ar' ? 'self-end bg-[#dcf8c6]' : 'self-start bg-white'}`} dir={buildingInfo.reminderLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    {previewContent}
                    <div className="text-right text-[8px] text-slate-400 mt-1 uppercase">Maintenant</div>
                 </div>
              </div>
              <button onClick={() => setPreviewContent(null)} className="absolute top-10 right-10 bg-white w-10 h-10 rounded-full flex items-center justify-center text-slate-900 shadow-xl"><i className="fas fa-times"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCenter;
