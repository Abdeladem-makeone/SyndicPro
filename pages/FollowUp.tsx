
import React, { useState, useEffect } from 'react';
import { Project, Complaint, Apartment, User, Attachment, ExpenseCategory } from '../types';

interface FollowUpProps {
  apartments: Apartment[];
  projects: Project[];
  complaints: Complaint[];
  currentUser: User;
  onAddProject: (p: Project) => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddComplaint: (c: Complaint) => void;
  onUpdateComplaint: (c: Complaint) => void;
  onDeleteComplaint: (id: string) => void;
  buildingName?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const FollowUp: React.FC<FollowUpProps> = ({
  apartments,
  projects,
  complaints,
  currentUser,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddComplaint,
  onUpdateComplaint,
  onDeleteComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'complaints'>('projects');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'project' | 'complaint' } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  const displayComplaints = isAdmin 
    ? complaints 
    : complaints.filter(c => c.apartmentId === currentUser.apartmentId);

  // --- FORM STATES ---
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    title: '', description: '', status: 'planned', priority: 'medium', attachments: []
  });
  
  const [complaintForm, setComplaintForm] = useState<Partial<Complaint>>({
    description: '', status: 'open', priority: 'medium', category: ExpenseCategory.OTHER, 
    date: new Date().toISOString().split('T')[0], attachments: []
  });

  const resetForms = () => {
    setProjectForm({ title: '', description: '', status: 'planned', priority: 'medium', attachments: [] });
    setComplaintForm({ description: '', status: 'open', priority: 'medium', category: ExpenseCategory.OTHER, date: new Date().toISOString().split('T')[0], attachments: [] });
  };

  // --- HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'project' | 'complaint') => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Fichier trop volumineux : ${file.name} (Max 5Mo)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const attachment: Attachment = { name: file.name, data: base64, type: file.type };
        if (target === 'project') setProjectForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), attachment] }));
        else setComplaintForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), attachment] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number, target: 'project' | 'complaint') => {
    if (target === 'project') {
      const newAttachments = [...(projectForm.attachments || [])];
      newAttachments.splice(index, 1);
      setProjectForm(prev => ({ ...prev, attachments: newAttachments }));
    } else {
      const newAttachments = [...(complaintForm.attachments || [])];
      newAttachments.splice(index, 1);
      setComplaintForm(prev => ({ ...prev, attachments: newAttachments }));
    }
  };

  const handleSaveProject = () => {
    if (!projectForm.title || !projectForm.description) {
      alert("Titre et Description requis.");
      return;
    }
    if (isEditing && projectForm.id) {
      onUpdateProject(projectForm as Project);
      if (viewingProject?.id === projectForm.id) setViewingProject(projectForm as Project);
    } else {
      const newProject: Project = {
        ...projectForm,
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: currentUser.username,
        status: projectForm.status || 'planned',
        priority: projectForm.priority || 'medium',
        attachments: projectForm.attachments || []
      } as Project;
      onAddProject(newProject);
    }
    setShowProjectModal(false);
    setIsEditing(false);
    resetForms();
  };

  const handleSaveComplaint = () => {
    if (!complaintForm.description) {
      alert("La description technique est obligatoire.");
      return;
    }
    const targetAptId = isAdmin ? (complaintForm.apartmentId || currentUser.apartmentId) : currentUser.apartmentId;
    const apt = apartments.find(a => a.id === targetAptId);

    if (isEditing && complaintForm.id) {
      onUpdateComplaint({ ...complaintForm, apartmentNumber: apt?.number || complaintForm.apartmentNumber } as Complaint);
      if (viewingComplaint?.id === complaintForm.id) setViewingComplaint({ ...complaintForm, apartmentNumber: apt?.number || complaintForm.apartmentNumber } as Complaint);
    } else {
      const newComplaint: Complaint = {
        ...complaintForm,
        id: Date.now().toString(),
        apartmentId: targetAptId || '',
        apartmentNumber: apt?.number || '?',
        date: complaintForm.date || new Date().toISOString().split('T')[0],
        status: 'open',
        priority: complaintForm.priority || 'medium',
        authorName: currentUser.username,
        attachments: complaintForm.attachments || []
      } as Complaint;
      onAddComplaint(newComplaint);
    }
    setShowComplaintModal(false);
    setIsEditing(false);
    resetForms();
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    if (type === 'project') {
      onDeleteProject(id);
      if (viewingProject?.id === id) setViewingProject(null);
    } else {
      onDeleteComplaint(id);
      if (viewingComplaint?.id === id) setViewingComplaint(null);
    }
    setItemToDelete(null);
  };

  // --- THEME COLOR LOGIC ---
  const accentColor = isEditing ? 'amber' : (showProjectModal ? 'indigo' : 'rose');
  const accentBg = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  }[accentColor];
  
  const accentBtn = {
    amber: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
  }[accentColor];

  const isResolved = viewingComplaint?.status === 'resolved';

  return (
    <div className="space-y-10 pb-20 relative min-h-[600px]">
      {/* MODALES GLOBALES - THEME PURE CLARITY */}
      {(showProjectModal || showComplaintModal) && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[1500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-[0_20px_70px_rgba(0,0,0,0.08)] border border-slate-200/60 animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto no-scrollbar flex flex-col">
            
            {/* Header épuré */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${accentBg}`}>
                  <i className={`fas ${showProjectModal ? 'fa-lightbulb' : 'fa-clipboard-check'}`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    {isEditing ? 'Modification' : (showProjectModal ? 'Nouveau Projet' : 'Nouvel Incident')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Service SyndicPro</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowProjectModal(false); setShowComplaintModal(false); setIsEditing(false); }} 
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Formulaire clair */}
            <div className="p-8 space-y-8">
              {showProjectModal ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Titre de la proposition</label>
                    <input 
                      type="text" 
                      placeholder="Identifiez votre idée..." 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-300" 
                      value={projectForm.title} 
                      onChange={e => setProjectForm({...projectForm, title: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Détails du projet</label>
                    <textarea 
                      rows={6} 
                      placeholder="Décrivez les bénéfices pour l'immeuble..." 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-300 leading-relaxed" 
                      value={projectForm.description} 
                      onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {isAdmin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Appartement concerné</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600 transition-all appearance-none cursor-pointer" 
                        value={complaintForm.apartmentId} 
                        onChange={e => setComplaintForm({...complaintForm, apartmentId: e.target.value})}
                      >
                        <option value="">Sélectionner un appartement</option>
                        {apartments.map(a => <option key={a.id} value={a.id}>Unité {a.number} - {a.owner}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description de l'incident</label>
                    <textarea 
                      rows={6} 
                      placeholder="Précisez la nature du problème..." 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600 transition-all placeholder:text-slate-300 leading-relaxed" 
                      value={complaintForm.description} 
                      onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} 
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Niveau d'Urgence</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-slate-600/20 transition-all appearance-none cursor-pointer" 
                    value={showProjectModal ? projectForm.priority : complaintForm.priority} 
                    onChange={e => showProjectModal ? setProjectForm({...projectForm, priority: e.target.value as any}) : setComplaintForm({...complaintForm, priority: e.target.value as any})}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Critique</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">État du Dossier</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-slate-600/20 transition-all appearance-none cursor-pointer" 
                      value={showProjectModal ? projectForm.status : complaintForm.status} 
                      onChange={e => showProjectModal ? setProjectForm({...projectForm, status: e.target.value as any}) : setComplaintForm({...complaintForm, status: e.target.value as any})}
                    >
                       <option value="open">Ouvert</option>
                       <option value="pending">En cours</option>
                       <option value="resolved">Résolu</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Photos - Style épuré */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documents et Photos</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {(showProjectModal ? projectForm.attachments : complaintForm.attachments)?.map((at, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100">
                      <img src={at.data} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeAttachment(idx, showProjectModal ? 'project' : 'complaint')} 
                        className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer">
                    <i className="fas fa-plus"></i>
                    <input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, showProjectModal ? 'project' : 'complaint')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => { setShowProjectModal(false); setShowComplaintModal(false); setIsEditing(false); }} 
                  className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-[0.2em]"
                >
                  Fermer
                </button>
                <button 
                  onClick={showProjectModal ? handleSaveProject : handleSaveComplaint} 
                  className={`flex-[1.5] py-4 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl transition-all tracking-[0.2em] hover:scale-[1.01] active:scale-95 ${accentBtn}`}
                >
                  {isEditing ? 'Valider' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUPPRESSION - CLAIRE */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-sm shadow-2xl animate-in zoom-in duration-300 text-center border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Suppression</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-8 leading-relaxed">Confirmez-vous le retrait définitif de ce dossier ?</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all">Confirmer</button>
              <button onClick={() => setItemToDelete(null)} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* VUE CONTENU (DETAIL OU LISTE) */}
      {viewingProject || viewingComplaint ? (
        /* VUE DÉTAILLÉE */
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center">
            <button onClick={() => { setViewingProject(null); setViewingComplaint(null); }} className="text-slate-500 font-black text-[10px] uppercase tracking-widest bg-white px-6 py-3 rounded-2xl border shadow-sm flex items-center gap-3 hover:bg-slate-50 transition-all">
              <i className="fas fa-arrow-left"></i> Retour à la liste
            </button>
            <div className="flex gap-3">
              {/* L'édition est désactivée pour les réclamations résolues */}
              {((viewingProject && (isAdmin || viewingProject.authorId === currentUser.id)) || 
                (viewingComplaint && (isAdmin || viewingComplaint.apartmentId === currentUser.apartmentId) && !isResolved)) && (
                <button onClick={() => { 
                  if (viewingProject) { setProjectForm({ ...viewingProject }); setShowProjectModal(true); } 
                  else { setComplaintForm({ ...viewingComplaint! }); setShowComplaintModal(true); }
                  setIsEditing(true);
                }} className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all shadow-sm group">
                  <i className="fas fa-pen group-hover:scale-110 transition-transform"></i>
                </button>
              )}
              {((viewingProject && (isAdmin || viewingProject.authorId === currentUser.id)) || 
                (viewingComplaint && (isAdmin || viewingComplaint.apartmentId === currentUser.apartmentId))) && (
                <button onClick={() => setItemToDelete({id: viewingProject ? viewingProject.id : viewingComplaint!.id, type: viewingProject ? 'project' : 'complaint'})} className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all shadow-sm group">
                  <i className="fas fa-trash-can group-hover:scale-110 transition-transform"></i>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className={`${viewingProject ? 'bg-indigo-600' : (isResolved ? 'bg-slate-400' : 'bg-rose-700')} p-10 text-white transition-colors`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-lg mb-4 inline-block">
                    {viewingProject ? 'Dossier de Projet' : `Ticket Incident Appt ${viewingComplaint!.apartmentNumber}`}
                  </span>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-tight">{viewingProject ? viewingProject.title : viewingComplaint!.category}</h1>
                </div>
                {isResolved && (
                  <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/30">
                    <i className="fas fa-archive mr-2"></i> Dossier Archivé
                  </span>
                )}
              </div>
            </div>
            <div className="p-10 space-y-8">
               <div className="flex gap-3">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isResolved ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {(viewingProject || viewingComplaint!).status}
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${(viewingProject || viewingComplaint!).priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    Urgence {(viewingProject || viewingComplaint!).priority}
                  </span>
               </div>
               {/* Formatage amélioré pour la lecture de la description */}
               <div className="text-base text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                 {(viewingProject || viewingComplaint!).description}
               </div>
               
               {(viewingProject || viewingComplaint!)?.attachments?.length ? (
                 <div className="pt-8 border-t space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pièces jointes et photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {(viewingProject || viewingComplaint!)?.attachments?.map((at: Attachment, idx: number) => (
                         <div key={idx} className="relative aspect-square group">
                           <img src={at.data} onClick={() => setSelectedImage(at.data)} className="w-full h-full rounded-[1.5rem] object-cover border cursor-pointer hover:scale-[1.02] transition-all shadow-md" />
                         </div>
                       ))}
                    </div>
                 </div>
               ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* VUE LISTE - REDESIGN COMPACT SMART */
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Suivi & Projets</h2>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Gestion active de la copropriété</p>
            </div>
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button onClick={() => setActiveTab('projects')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>Projets</button>
              <button onClick={() => setActiveTab('complaints')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'complaints' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') + ' text-white shadow-lg' : 'text-slate-500 hover:text-teal-700'}`}>Plaintes</button>
            </div>
          </div>

          {/* Banner d'action Compacte */}
          <div className={`flex flex-col sm:flex-row justify-between items-center ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-50/50' : 'bg-teal-50/50') : 'bg-rose-50/50'} p-6 rounded-3xl border border-slate-100 shadow-sm gap-6`}>
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') : 'bg-rose-600'} text-white rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
                  <i className={`fas ${activeTab === 'projects' ? 'fa-lightbulb' : 'fa-wrench'}`}></i>
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{activeTab === 'projects' ? 'Une nouvelle idée ?' : 'Signaler un incident ?'}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Contribuer à l'amélioration collective</p>
               </div>
            </div>
            <button onClick={() => { resetForms(); setIsEditing(false); activeTab === 'projects' ? setShowProjectModal(true) : setShowComplaintModal(true); }} className={`w-full sm:w-auto px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg text-white transition-all active:scale-95 ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') : 'bg-rose-600'}`}>
              <i className="fas fa-plus mr-2"></i> Nouveau
            </button>
          </div>

          {activeTab === 'projects' ? (
            /* GRILLE DE CARTES COMPACTES POUR LES PROJETS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => {
                const priorityColor = p.priority === 'high' ? 'bg-rose-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-indigo-400';
                return (
                  <div 
                    key={p.id} 
                    onClick={() => setViewingProject(p)} 
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex overflow-hidden relative"
                  >
                    {/* Barre de priorité latérale */}
                    <div className={`w-2 ${priorityColor} transition-all group-hover:w-3`}></div>
                    
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                           <i className="fas fa-user-circle text-slate-300"></i> {p.authorName}
                        </span>
                        {(isAdmin || p.authorId === currentUser.id) && (
                          <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: p.id, type: 'project'}); }} className="text-slate-300 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100">
                          {p.status}
                        </span>
                        {p.attachments && p.attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                             <i className="fas fa-image text-slate-300"></i> {p.attachments.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">Aucun projet en cours.</div>
              )}
            </div>
          ) : (
            /* GRILLE DE CARTES COMPACTES POUR LES RÉCLAMATIONS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayComplaints.map(c => {
                 const complaintResolved = c.status === 'resolved';
                 const priorityColor = complaintResolved ? 'bg-slate-300' : (c.priority === 'high' ? 'bg-rose-500' : c.priority === 'medium' ? 'bg-amber-400' : 'bg-teal-400');
                 
                 return (
                  <div 
                    key={c.id} 
                    onClick={() => setViewingComplaint(c)} 
                    className={`bg-white rounded-3xl border border-slate-100 shadow-sm transition-all cursor-pointer group flex overflow-hidden relative ${
                      complaintResolved ? 'opacity-60 grayscale bg-slate-50/50' : 'hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <div className={`w-2 ${priorityColor} transition-all group-hover:w-3`}></div>
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                          complaintResolved ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                           Appt {c.apartmentNumber}
                        </span>
                        {(isAdmin || c.apartmentId === currentUser.apartmentId) && (
                           <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: c.id, type: 'complaint'}); }} className="text-slate-300 hover:text-rose-500 transition-colors">
                             <i className="fas fa-trash-can text-xs"></i>
                           </button>
                        )}
                      </div>
                      <h3 className={`text-sm font-black uppercase tracking-tight line-clamp-1 transition-colors ${
                        complaintResolved ? 'text-slate-400' : 'text-slate-800 group-hover:text-rose-600'
                      }`}>
                        {c.description}
                      </h3>
                      <div className="flex justify-between items-center pt-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                          complaintResolved ? 'bg-slate-200 text-slate-500 border-slate-300' : (c.status === 'open' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100')
                        }`}>
                           {c.status}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                  </div>
                 );
              })}
              {displayComplaints.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">Aucun signalement archivé.</div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/98 z-[3000] flex items-center justify-center p-8 cursor-pointer overflow-hidden" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full rounded-[2rem] shadow-2xl animate-in zoom-in duration-300 border-4 border-white/5" alt="Vue agrandie" />
        </div>
      )}
    </div>
  );
};

export default FollowUp;
