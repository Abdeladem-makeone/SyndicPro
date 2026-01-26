
import React, { useState } from 'react';
import { Apartment, ProfileRequest } from '../types';

interface OwnerProfileProps {
  apartment: Apartment;
  onUpdateApt: (apt: Apartment) => void;
  onRequestPhoneChange: (req: ProfileRequest) => void;
  pendingRequests: ProfileRequest[];
  onDismissRequest?: (id: string) => void;
  language?: 'fr' | 'ar';
}

const OwnerProfile: React.FC<OwnerProfileProps> = ({ 
  apartment, onUpdateApt, onRequestPhoneChange, pendingRequests, onDismissRequest, language = 'fr' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isAr = language === 'ar';
  
  const [formData, setFormData] = useState({
    owner: apartment.owner,
    email: apartment.email,
    phone: apartment.phone
  });

  const translations = {
    fr: {
      title: 'Mon Profil & Appartement',
      desc: 'Données certifiées de votre dossier',
      aptNum: 'Appartement',
      floor: 'Étage',
      shares: 'Millièmes',
      fee: 'Cotisation',
      ownerName: 'Nom Complet',
      email: 'E-mail',
      phone: 'N° Téléphone (WhatsApp)',
      edit: 'Modifier mon Profil',
      save: 'Enregistrer les modifications',
      cancel: 'Annuler',
      rejectTitle: 'Changement de numéro refusé',
      rejectDesc: 'Votre demande a été rejetée par le syndic.',
      pending: 'En attente de validation',
      infoSecurity: 'Toute modification du téléphone doit être validée.',
      rdc: 'Rez-de-chaussée'
    },
    ar: {
      title: 'ملفي الشخصي وشقتي',
      desc: 'البيانات الموثقة لملفكم',
      aptNum: 'الشقة رقم',
      floor: 'الطابق',
      shares: 'الحصص (مساهمة)',
      fee: 'الواجب الشهري',
      ownerName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف (واتساب)',
      edit: 'تعديل بياناتي',
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      rejectTitle: 'تم رفض تغيير الرقم',
      rejectDesc: 'تم رفض طلبكم من طرف السانديك.',
      pending: 'في انتظار التحقق',
      infoSecurity: 'أي تغيير في الهاتف يتطلب موافقة.',
      rdc: 'الطابق الأرضي'
    }
  };

  const t = translations[language];

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
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* ALERTE REJET */}
      {isRejected && (
        <div className={`bg-rose-50 border border-rose-200 p-8 rounded-[2.5rem] flex items-center justify-between shadow-lg shadow-rose-100 ${isAr ? 'flex-row-reverse' : ''}`}>
           <div className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse' : ''}`}>
              <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-inner"><i className="fas fa-circle-xmark"></i></div>
              <div className={isAr ? 'text-right' : 'text-left'}>
                 <p className={`font-black text-rose-900 ${isAr ? 'text-2xl' : 'text-lg'}`}>{t.rejectTitle}</p>
                 <p className={`font-bold uppercase mt-1 text-rose-500 tracking-widest ${isAr ? 'text-sm' : 'text-xs'}`}>{t.rejectDesc}</p>
              </div>
           </div>
           <button onClick={() => onDismissRequest?.(activeRequest.id)} className="w-12 h-12 bg-white border border-rose-100 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 shadow-sm transition-all"><i className="fas fa-times"></i></button>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 ${isAr ? 'lg:flex-row-reverse' : ''}`}>
        {/* CARTE TECHNIQUE (UrbanShop Dark) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl space-y-12 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-city text-9xl"></i></div>
           <div className={`relative z-10 ${isAr ? 'text-right' : 'text-left'}`}>
              <p className={`font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.aptNum}</p>
              <h2 className="text-7xl font-black tracking-tighter">{apartment.number}</h2>
           </div>
           <div className="space-y-8 pt-8 border-t border-white/10 relative z-10">
              <div className={`flex justify-between items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                 <span className={`font-black text-slate-500 uppercase tracking-widest ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.floor}</span>
                 <span className={`font-bold text-slate-200 ${isAr ? 'text-xl' : 'text-lg'}`}>{apartment.floor === 0 ? t.rdc : (isAr ? `الطابق ${apartment.floor}` : `${apartment.floor}ème étage`)}</span>
              </div>
              <div className={`flex justify-between items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                 <span className={`font-black text-slate-500 uppercase tracking-widest ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.shares}</span>
                 <span className={`font-bold text-slate-200 ${isAr ? 'text-xl' : 'text-lg'}`}>{apartment.shares} / 1000</span>
              </div>
              <div className={`flex justify-between items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                 <span className={`font-black text-slate-500 uppercase tracking-widest ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.fee}</span>
                 <span className={`font-black text-indigo-400 ${isAr ? 'text-2xl' : 'text-xl'}`}>{apartment.monthlyFee.toLocaleString()} DH</span>
              </div>
           </div>
        </div>

        {/* FORMULAIRE (UrbanShop Modern) */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 sm:p-14 border border-slate-100 shadow-sm flex flex-col justify-between">
           <div className={`flex flex-col sm:flex-row justify-between items-start gap-6 mb-12 ${isAr ? 'flex-row-reverse' : ''}`}>
              <div className={isAr ? 'text-right' : 'text-left'}>
                 <h3 className={`font-black text-slate-800 uppercase tracking-tight ${isAr ? 'text-4xl' : 'text-3xl'}`}>{t.title}</h3>
                 <p className={`font-bold text-slate-400 uppercase tracking-widest mt-2 ${isAr ? 'text-base' : 'text-[11px]'}`}>{t.desc}</p>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className={`px-10 py-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md ${isAr ? 'text-sm' : 'text-[10px]'}`}>
                  <i className="fas fa-edit mr-2"></i> {t.edit}
                </button>
              )}
           </div>

           <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-2">
                   <label className={`font-black text-slate-400 uppercase tracking-[0.2em] ml-1 ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.ownerName}</label>
                   {isEditing ? (
                     <input type="text" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all ${isAr ? 'text-xl text-right' : 'text-base'}`} />
                   ) : (
                     <p className={`px-8 py-5 bg-slate-50/50 rounded-[1.5rem] font-black text-slate-800 border border-transparent shadow-inner ${isAr ? 'text-2xl text-right' : 'text-lg'}`}>{apartment.owner}</p>
                   )}
                </div>
                <div className="space-y-2">
                   <label className={`font-black text-slate-400 uppercase tracking-[0.2em] ml-1 ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.email}</label>
                   {isEditing ? (
                     <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all ${isAr ? 'text-xl text-right' : 'text-base'}`} />
                   ) : (
                     <p className={`px-8 py-5 bg-slate-50/50 rounded-[1.5rem] font-black text-slate-800 border border-transparent shadow-inner truncate ${isAr ? 'text-2xl text-right' : 'text-lg'}`}>{apartment.email || '-'}</p>
                   )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                   <label className={`font-black text-slate-400 uppercase tracking-[0.2em] ml-1 ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.phone}</label>
                   <div className="relative">
                      {isEditing ? (
                        <input type="tel" disabled={isPending} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all ${isPending ? 'opacity-50' : ''} ${isAr ? 'text-xl text-right' : 'text-base'}`} />
                      ) : (
                        <p className={`px-8 py-5 bg-slate-50/50 rounded-[1.5rem] font-black text-slate-800 border border-transparent shadow-inner flex items-center gap-4 ${isAr ? 'flex-row-reverse text-2xl' : 'text-lg'}`}>
                           <i className="fab fa-whatsapp text-emerald-600"></i> {apartment.phone}
                        </p>
                      )}
                      {isPending && <span className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg animate-pulse ${isAr ? 'text-xs' : 'text-[9px]'}`}>{t.pending}</span>}
                   </div>
                   {!isEditing && (
                      <p className={`text-slate-400 font-bold italic mt-2 ${isAr ? 'text-right text-xs' : 'text-[10px]'}`}>* {t.infoSecurity}</p>
                   )}
                </div>
              </div>

              {isEditing && (
                <div className={`flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-50 ${isAr ? 'flex-row-reverse' : ''}`}>
                   <button onClick={handleSaveProfile} className={`flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all ${isAr ? 'text-xl' : 'text-[11px]'}`}>{t.save}</button>
                   <button onClick={() => { setIsEditing(false); setFormData({owner: apartment.owner, email: apartment.email, phone: apartment.phone}); }} className={`flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all ${isAr ? 'text-xl' : 'text-[11px]'}`}>{t.cancel}</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
