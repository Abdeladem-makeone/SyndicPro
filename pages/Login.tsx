
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Apartment, BuildingInfo } from '../types';
import { generateLoginOTPWhatsAppLink } from '../utils/whatsappUtils';

interface LoginProps {
  apartments: Apartment[];
  buildingInfo: BuildingInfo;
  onLogin: (user: any) => void;
}

const OTP_VALIDITY_SECONDS = 60;

const Login: React.FC<LoginProps> = ({ apartments, buildingInfo, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'syndic' | 'owner'>('syndic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // États pour proprio
  const [selectedAptId, setSelectedAptId] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpGeneratedAt, setOtpGeneratedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS);
  
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isOwnerInterfaceEnabled = buildingInfo?.ownerInterfaceEnabled === true;

  // Trier les appartements pour la liste déroulante
  const sortedApartments = useMemo(() => {
    return [...apartments].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [apartments]);

  // Fonction pour nettoyer un numéro de téléphone
  const normalizePhone = (p: string) => p.replace(/\D/g, '');

  // Gérer le compte à rebours
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft]);

  const handleSyndicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = buildingInfo?.adminPassword || 'admin';
    
    if (username === 'admin' && password === storedPassword) {
      onLogin({ id: 'admin', username: 'Administrateur', role: 'admin' });
    } else {
      setError('Identifiants Syndic incorrects.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSendOtp = () => {
    const inputPhone = normalizePhone(phone);
    const syndicContact = buildingInfo?.syndicContactNumber;

    if (!syndicContact) {
      setError("Le syndic n'a pas configuré son numéro de contact. Impossible de se connecter.");
      return;
    }

    if (!selectedAptId || !inputPhone) {
      setError('Veuillez sélectionner votre appartement et saisir votre téléphone.');
      return;
    }

    const apt = apartments.find(a => a.id === selectedAptId);

    if (apt) {
      const storedPhone = normalizePhone(apt.phone || '');
      const phoneMatch = storedPhone !== '' && (storedPhone === inputPhone || storedPhone.endsWith(inputPhone) || inputPhone.endsWith(storedPhone));
      
      if (phoneMatch) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setOtpGeneratedAt(Date.now());
        setTimeLeft(OTP_VALIDITY_SECONDS);
        setStep(2);
        setError('');

        // Générer le lien WhatsApp vers le numéro du syndic
        const whatsappLink = generateLoginOTPWhatsAppLink(
          syndicContact,
          apt.owner,
          apt.number,
          otp
        );

        if (whatsappLink) {
          window.open(whatsappLink, '_blank');
        } else {
          setError("Erreur lors de la génération du lien WhatsApp.");
        }
      } else {
        setError("Le numéro de téléphone ne correspond pas à celui enregistré dans l'annuaire.");
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const handleVerifyOtp = () => {
    const now = Date.now();
    const isExpired = !otpGeneratedAt || (now - otpGeneratedAt > OTP_VALIDITY_SECONDS * 1000);

    if (isExpired) {
      setError('Code de vérification expiré (Validité : 1 min). Veuillez recommencer.');
      return;
    }

    if (enteredOtp === generatedOtp && generatedOtp !== '') {
      const apt = apartments.find(a => a.id === selectedAptId);
      onLogin({ 
        id: apt?.id || 'owner', 
        username: apt?.owner || 'Propriétaire', 
        role: 'owner',
        apartmentId: apt?.id 
      });
    } else {
      setError('Code de vérification incorrect.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReset = () => {
    setStep(1);
    setEnteredOtp('');
    setGeneratedOtp('');
    setOtpGeneratedAt(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <i className="fas fa-city text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black tracking-tight">SyndicPro Manager</h1>
          <p className="text-indigo-100 text-xs mt-1 font-medium opacity-80 uppercase tracking-widest">Portail de Copropriété</p>
        </div>

        <div className={`flex border-b ${!isOwnerInterfaceEnabled ? 'hidden' : ''}`}>
          <button 
            onClick={() => { setActiveTab('syndic'); handleReset(); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'syndic' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Espace Syndic
          </button>
          <button 
            onClick={() => { setActiveTab('owner'); handleReset(); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'owner' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Espace Propriétaire
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {activeTab === 'syndic' ? (
            <form onSubmit={handleSyndicLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant</label>
                <div className="relative">
                  <i className="fas fa-user-shield absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="Ex: admin" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest mt-4">
                Connexion Syndic <i className="fas fa-chevron-right"></i>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
                {step === 1 ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appartement</label>
                        <div className="relative">
                          <i className="fas fa-door-closed absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
                          <select 
                            value={selectedAptId} 
                            onChange={e => setSelectedAptId(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium appearance-none"
                          >
                            <option value="">Choisir un appartement...</option>
                            {sortedApartments.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                {apt.number} - {apt.owner}
                              </option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Votre N° Téléphone</label>
                        <div className="relative">
                          <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="Ex: 06 12 34 56 78" />
                        </div>
                      </div>
                      <button 
                        onClick={handleSendOtp} 
                        disabled={!selectedAptId}
                        className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest mt-4"
                      >
                        Vérifier via WhatsApp <i className="fab fa-whatsapp text-sm"></i>
                      </button>
                      <p className="text-[9px] text-slate-400 text-center font-medium leading-relaxed italic">
                        Le code sera envoyé au numéro du syndic :<br/>
                        <span className="font-bold text-indigo-400">{buildingInfo.syndicContactNumber || 'Non configuré'}</span>
                      </p>
                    </>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saisir le code</label>
                          <span className={`text-[10px] font-black uppercase ${timeLeft < 15 ? 'text-rose-500 animate-pulse' : 'text-indigo-600'}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <input 
                          type="text" 
                          maxLength={6} 
                          disabled={timeLeft === 0}
                          placeholder="------"
                          value={enteredOtp} 
                          onChange={e => setEnteredOtp(e.target.value)}
                          className={`w-full text-center text-3xl font-black py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest ${timeLeft === 0 ? 'opacity-50 grayscale' : ''}`} 
                        />
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-1000 ${timeLeft < 20 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                             style={{ width: `${(timeLeft / OTP_VALIDITY_SECONDS) * 100}%` }}
                           ></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={handleVerifyOtp} 
                          disabled={timeLeft === 0 || enteredOtp.length < 6}
                          className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                        >
                          Valider la connexion
                        </button>
                        <button 
                          onClick={handleReset} 
                          className="w-full py-2 text-slate-400 font-black hover:text-slate-600 uppercase text-[9px] tracking-widest"
                        >
                          Code non reçu ? Recommencer
                        </button>
                      </div>
                    </div>
                  )}
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SyndicPro Manager © 2024 - Sécurisé LOCAL-ONLY</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
