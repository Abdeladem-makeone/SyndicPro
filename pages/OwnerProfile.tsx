
import React, { useState } from 'react';
import { Apartment, ProfileRequest } from '../types';

interface OwnerProfileProps {
  apartment: Apartment;
  onUpdateApt: (apt: Apartment) => void;
  onRequestPhoneChange: (req: ProfileRequest) => void;
  pendingRequests: ProfileRequest[];
  onDismissRequest?: (id: string) => void;
}

const OwnerProfile: React.FC<OwnerProfileProps> = ({ 
  apartment, onUpdateApt, onRequestPhoneChange, pendingRequests, onDismissRequest 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    owner: apartment.owner,
    email: apartment.email,
    phone: apartment.phone
  });

  const activeRequest = pendingRequests.find(r => r.apartmentId === apartment.id);
  const isPending = activeRequest?.status === 'pending';
  const isRejected = activeRequest?.status === 'rejected';

  const handleSaveProfile = () => {
    if (formData.owner !== apartment.owner || formData.email !== apartment.email) {
      onUpdateApt({ ...apartment, owner: formData.owner, email: formData.email });
    }
    if (formData.phone !== apartment.phone) {
      onRequestPhoneChange({
        id: Date.now().toString(),
        apartmentId: apartment.id,
        apartmentNumber: apartment.number,
        ownerName: formData.owner,
        currentPhone: apartment.phone,
        newPhone: formData.phone,
        date: new Date().toISOString(),
        status: 'pending'
      });
      alert("Votre demande de changement de téléphone a été envoyée au syndic.");
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-5 mb-4">
         <div className="w-14 h-14 bg-teal-700 text-white rounded-2xl flex items-center justify-center text-xl shadow-2xl shadow-teal-100">
            <i className="fas fa-user-shield"></i>
         </div>
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-wider">Identité & Propriété</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Données certifiées de votre appartement</p>
         </div>
      </div>

      {isRejected && (
        <div className="bg-rose-50 border-2 border-rose-200 p-8 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-rose-100">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg text-lg"><i className="fas fa-circle-xmark"></i></div>
              <div>
                 <p className="text-sm font-black text-rose-900 leading-tight">Modification du numéro refusée</p>
                 <p className="text-[11px] text-rose-700 font-bold uppercase tracking-widest mt-1.5">Le syndic a rejeté votre demande pour des raisons de sécurité. Contactez le bureau.</p>
              </div>
           </div>
           <button 
             onClick={() => onDismissRequest && onDismissRequest(activeRequest.id)}
             className="px-6 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
           >
             Fermer l'alerte
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Fiche technique de l'appartement - Style "Gold/Premium" */}
        <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl space-y-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <i className="fas fa-building text-9xl"></i>
           </div>
           
           <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">Numéro de Résidence</p>
              <p className="text-6xl font-black tracking-tighter">APPT {apartment.number}</p>
           </div>
           
           <div className="grid grid-cols-1 gap-8 pt-8 border-t border-white/10 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal-400"><i className="fas fa-layer-group"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Localisation</p>
                    <p className="font-black text-slate-200">{apartment.floor === 0 ? 'Rez-de-chaussée' : `${apartment.floor}ème Étage`}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal-400"><i className="fas fa-chart-pie"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Quotité</p>
                    <p className="font-black text-slate-200">{apartment.shares} / 1000 millièmes</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal-400"><i className="fas fa-hand-holding-dollar"></i></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forfait Mensuel</p>
                    <p className="font-black text-slate-200">{apartment.monthlyFee.toLocaleString()} DH</p>
                 </div>
              </div>
           </div>
           
           <div className="bg-teal-500/10 p-6 rounded-[2rem] border border-teal-500/20 relative z-10">
              <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2"><i className="fas fa-info-circle"></i> Mention légale</p>
              <p className="text-[10px] text-teal-100/70 font-medium leading-relaxed italic">Les données techniques sont extraites du règlement de copropriété déposé. Toute erreur doit être signalée au syndic avec justificatif.</p>
           </div>
        </div>

        {/* Formulaire de profil - Style Épuré */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-12">
              <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Coordonnées du Propriétaire</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gérez vos accès et informations de contact</p>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-4 bg-slate-50 text-teal-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 hover:text-white transition-all border border-slate-100 shadow-sm"
                >
                  <i className="fas fa-pen-to-square mr-2"></i> Modifier mon profil
                </button>
              )}
           </div>

           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identité Complète</label>
                   {isEditing ? (
                     <input 
                       type="text" 
                       value={formData.owner}
                       onChange={(e) => setFormData({...formData, owner: e.target.value})}
                       className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-teal-600 outline-none transition-all" 
                     />
                   ) : (
                     <div className="px-8 py-5 bg-slate-50/50 rounded-2xl font-black text-slate-800 text-lg border border-transparent shadow-inner">{apartment.owner}</div>
                   )}
                </div>
                
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Courriel de correspondance</label>
                   {isEditing ? (
                     <input 
                       type="email" 
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-teal-600 outline-none transition-all" 
                     />
                   ) : (
                     <div className="px-8 py-5 bg-slate-50/50 rounded-2xl font-black text-slate-800 text-lg border border-transparent shadow-inner truncate">{apartment.email || 'Non renseigné'}</div>
                   )}
                </div>

                <div className="space-y-3 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro WhatsApp Officiel</label>
                   <div className="relative group">
                      {isEditing ? (
                        <input 
                          type="tel" 
                          disabled={isPending}
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-teal-600 outline-none transition-all ${isPending ? 'opacity-50 grayscale' : ''}`} 
                          placeholder="Ex: 06 12 34 56 78"
                        />
                      ) : (
                        <div className="px-8 py-5 bg-slate-50/50 rounded-2xl font-black text-slate-800 text-lg border border-transparent shadow-inner flex items-center gap-4">
                           <i className="fab fa-whatsapp text-teal-600"></i>
                           {apartment.phone}
                        </div>
                      )}
                      {isPending && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl animate-pulse">
                          Validation Syndic en attente
                        </div>
                      )}
                   </div>
                   {isEditing && !isPending && (
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1"><i className="fas fa-shield-halved mr-1"></i> Toute modification du téléphone nécessite une validation par le bureau du syndic.</p>
                   )}
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                   <button 
                     onClick={handleSaveProfile}
                     className="bg-teal-700 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-teal-100 hover:bg-teal-800 hover:scale-[1.02] transition-all"
                   >
                     Appliquer les modifications
                   </button>
                   <button 
                     onClick={() => { setIsEditing(false); setFormData({owner: apartment.owner, email: apartment.email, phone: apartment.phone}); }}
                     className="px-12 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     Annuler
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
