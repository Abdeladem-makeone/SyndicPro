
import React, { useState } from 'react';
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

  // --- UI COMPONENTS ---
  const DeleteConfirmModal = () => {
    if (!itemToDelete) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-trash-can"></i>
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Supprimer ?</h4>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-8">Cette action est définitive.</p>
          <div className="flex gap-3">
            <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 rounded-2xl border transition-all">Annuler</button>
            <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl shadow-rose-100">Confirmer</button>
          </div>
        </div>
      </div>
    );
  };

  if (viewingProject || viewingComplaint) {
    const item = viewingProject || viewingComplaint!;
    const type = viewingProject ? 'project' : 'complaint';
    const canManage = isAdmin || (type === 'project' ? (item as Project).authorId === currentUser.id : (item as Complaint).apartmentId === currentUser.apartmentId);

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-20">
        <DeleteConfirmModal />
        <div className="flex justify-between items-center">
          <button onClick={() => { setViewingProject(null); setViewingComplaint(null); }} className="text-slate-500 font-black text-[10px] uppercase tracking-widest bg-white px-6 py-3 rounded-2xl border shadow-sm flex items-center gap-3 hover:bg-slate-50 transition-all">
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
          {canManage && (
            <div className="flex gap-3">
              <button onClick={() => { 
                if (type === 'project') { setProjectForm(item as Project); setShowProjectModal(true); } 
                else { setComplaintForm(item as Complaint); setShowComplaintModal(true); }
                setIsEditing(true);
              }} className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm group">
                <i className="fas fa-pen group-hover:scale-110 transition-transform"></i>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: item.id, type: type as any}); }} className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all shadow-sm group">
                <i className="fas fa-trash-can group-hover:scale-110 transition-transform"></i>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className={`${type === 'project' ? 'bg-indigo-600' : 'bg-rose-700'} p-10 text-white`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-lg mb-4 inline-block">
              {type === 'project' ? 'Dossier de Projet' : `Ticket Incident Appt ${(item as Complaint).apartmentNumber}`}
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-tight">{type === 'project' ? (item as Project).title : (item as Complaint).category}</h1>
          </div>
          <div className="p-10 space-y-8">
             <div className="flex gap-3">
                <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">{item.status}</span>
                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${item.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>Urgence {item.priority}</span>
             </div>
             <p className="text-base text-slate-700 font-medium leading-relaxed">{item.description}</p>
             {(item as any).attachments?.length > 0 && (
               <div className="pt-8 border-t space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pièces jointes et photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {(item as any).attachments.map((at: Attachment, idx: number) => (
                       <div key={idx} className="relative aspect-square group">
                         <img src={at.data} onClick={() => setSelectedImage(at.data)} className="w-full h-full rounded-[1.5rem] object-cover border cursor-pointer hover:scale-[1.02] transition-all shadow-md" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-[1.5rem] flex items-center justify-center transition-opacity pointer-events-none">
                            <i className="fas fa-search-plus text-white text-xl"></i>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 relative">
      <DeleteConfirmModal />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Suivi & Projets</h2>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Gestion active de la copropriété</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab('projects')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>Projets</button>
          <button onClick={() => setActiveTab('complaints')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'complaints' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') + ' text-white shadow-lg' : 'text-slate-500 hover:text-teal-700'}`}>Plaintes</button>
        </div>
      </div>

      <div className="animate-in fade-in duration-500 space-y-8">
        {/* Barre d'action rapide */}
        <div className={`flex flex-col sm:flex-row justify-between items-center ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-900 border-slate-800') : 'bg-rose-50 border-rose-100'} p-8 rounded-[2.5rem] border shadow-xl shadow-slate-100/50 gap-6`}>
          <div className="flex items-center gap-6">
             <div className={`w-14 h-14 ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600' : 'bg-teal-700') : 'bg-rose-600'} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                <i className={`fas ${activeTab === 'projects' ? 'fa-lightbulb' : 'fa-wrench'}`}></i>
             </div>
             <div>
                <h4 className={`text-lg font-black ${activeTab === 'projects' && !isAdmin ? 'text-white' : 'text-slate-800'} uppercase tracking-tight`}>{activeTab === 'projects' ? 'Proposer une idée' : 'Signaler un problème'}</h4>
                <p className={`text-xs ${activeTab === 'projects' && !isAdmin ? 'text-slate-400' : 'text-slate-500'} font-bold uppercase tracking-widest mt-1`}>{activeTab === 'projects' ? 'Contribuer à l\'amélioration de la résidence' : 'Maintenance et interventions techniques'}</p>
             </div>
          </div>
          <button 
            onClick={() => { resetForms(); setIsEditing(false); activeTab === 'projects' ? setShowProjectModal(true) : setShowComplaintModal(true); }} 
            className={`w-full sm:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl text-white hover:scale-[1.02] transition-all active:scale-95 ${activeTab === 'projects' ? (isAdmin ? 'bg-indigo-600 shadow-indigo-100' : 'bg-teal-700 shadow-teal-900/40') : 'bg-rose-600 shadow-rose-100'}`}
          >
            <i className="fas fa-plus mr-3"></i> {activeTab === 'projects' ? 'Lancer un projet' : 'Nouvel Incident'}
          </button>
        </div>

        {activeTab === 'projects' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <div key={p.id} onClick={() => setViewingProject(p)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{p.status}</span>
                     {(isAdmin || p.authorId === currentUser.id) && (
                       <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: p.id, type: 'project'}); }} className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><i className="fas fa-trash-alt text-lg"></i></button>
                     )}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">{p.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{p.description}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black shadow-inner border border-indigo-100">{p.authorName.charAt(0)}</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.authorName}</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <i className="fas fa-arrow-right text-[10px]"></i>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayComplaints.map(c => (
              <div key={c.id} onClick={() => setViewingComplaint(c)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex gap-6 group">
                 <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] border border-slate-200 flex items-center justify-center text-slate-400 text-3xl flex-shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {c.attachments?.length ? <img src={c.attachments[0].data} className="w-full h-full object-cover" /> : <i className="fas fa-wrench opacity-40"></i>}
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
                    <div className="flex justify-between items-start">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${c.status === 'resolved' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>Appartement {c.apartmentNumber} • {c.status}</span>
                       {(isAdmin || c.apartmentId === currentUser.apartmentId) && (
                         <button onClick={(e) => { e.stopPropagation(); setItemToDelete({id: c.id, type: 'complaint'}); }} className="text-rose-300 hover:text-rose-600 transition-colors"><i className="fas fa-trash-can"></i></button>
                       )}
                    </div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-rose-600 transition-colors leading-tight">{c.description}</h3>
                    <div className="flex items-center gap-4 text-slate-400">
                       <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><i className="fas fa-calendar text-[10px]"></i> {new Date(c.date).toLocaleDateString()}</p>
                       <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                       <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><i className="fas fa-tag text-[10px]"></i> {c.category}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'projects' ? projects.length : displayComplaints.length) === 0 && (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                <i className={`fas ${activeTab === 'projects' ? 'fa-lightbulb' : 'fa-inbox'} text-4xl`}></i>
             </div>
             <h4 className="text-lg font-black text-slate-300 uppercase tracking-[0.2em]">Aucun élément à afficher</h4>
             <p className="text-sm text-slate-400 font-medium mt-2">Cliquez sur le bouton pour créer une nouvelle entrée.</p>
          </div>
        )}
      </div>

      {/* MODALES RE-STYLISÉES À GRANDE ÉCHELLE - ÉDITION AMÉLIORÉE */}
      {(showProjectModal || showComplaintModal) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto no-scrollbar border border-white/20">
            {/* Header Dynamique */}
            <div className={`p-10 ${isEditing ? 'bg-amber-500' : (showProjectModal ? 'bg-indigo-600' : 'bg-rose-700')} text-white transition-colors duration-500`}>
              <div className="flex justify-between items-start">
                <div>
                   <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full mb-4">
                     {isEditing ? <><i className="fas fa-pen-nib"></i> Mode Modification</> : <><i className="fas fa-plus"></i> Création Dossier</>}
                   </span>
                   <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                     {showProjectModal ? 'Fiche Projet Immobilié' : 'Signalement Technique'}
                   </h3>
                </div>
                <button onClick={() => { setShowProjectModal(false); setShowComplaintModal(false); setIsEditing(false); }} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 rounded-2xl transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              {showProjectModal ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fas fa-heading text-indigo-500"></i> Intitulé du projet *
                    </label>
                    <input type="text" placeholder="Ex: Modernisation de l'ascenseur" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fas fa-align-left text-indigo-500"></i> Description détaillée *
                    </label>
                    <textarea rows={5} placeholder="Justifiez le besoin et les bénéfices pour la copropriété..." className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-base font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {isAdmin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <i className="fas fa-building text-rose-500"></i> Appartement concerné
                      </label>
                      <select className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black uppercase outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner" value={complaintForm.apartmentId} onChange={e => setComplaintForm({...complaintForm, apartmentId: e.target.value})}>
                        <option value="">Sélectionner un appartement...</option>
                        {apartments.map(a => <option key={a.id} value={a.id}>Unité {a.number} - {a.owner}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fas fa-wrench text-rose-500"></i> Nature de l'incident *
                    </label>
                    <textarea rows={5} placeholder="Décrivez le problème technique (fuite, panne, dégradation)..." className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-base font-medium outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner" value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <i className="fas fa-bolt text-amber-500"></i> Priorité
                  </label>
                  <select className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black uppercase outline-none focus:ring-2 focus:ring-slate-400 transition-all shadow-inner" value={showProjectModal ? projectForm.priority : complaintForm.priority} onChange={e => showProjectModal ? setProjectForm({...projectForm, priority: e.target.value as any}) : setComplaintForm({...complaintForm, priority: e.target.value as any})}>
                    <option value="low">Standard</option>
                    <option value="medium">Modéré</option>
                    <option value="high">Urgent / Critique</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <i className="fas fa-tasks text-slate-500"></i> État de traitement
                    </label>
                    <select className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black uppercase outline-none focus:ring-2 focus:ring-slate-400 transition-all shadow-inner" value={showProjectModal ? projectForm.status : complaintForm.status} onChange={e => showProjectModal ? setProjectForm({...projectForm, status: e.target.value as any}) : setComplaintForm({...complaintForm, status: e.target.value as any})}>
                       <option value="open">Ouvert</option>
                       <option value="pending">En cours</option>
                       <option value="resolved">Résolu / Terminé</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Gestion Avancée des Photos */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <i className="fas fa-camera text-slate-500"></i> Photos du dossier (Max 5Mo)
                </label>
                
                {/* Prévisualisation avec suppression */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {(showProjectModal ? projectForm.attachments : complaintForm.attachments)?.map((at, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border shadow-sm">
                      <img src={at.data} className="w-full h-full object-cover" />
                      <button onClick={() => removeAttachment(idx, showProjectModal ? 'project' : 'complaint')} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fas fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all cursor-pointer bg-slate-50">
                    <i className="fas fa-plus text-sm"></i>
                    <input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, showProjectModal ? 'project' : 'complaint')} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-10 border-t border-slate-100">
                <button onClick={() => { setShowProjectModal(false); setShowComplaintModal(false); setIsEditing(false); }} className="flex-1 py-5 text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl border transition-all tracking-[0.1em]">Annuler</button>
                <button 
                  onClick={showProjectModal ? handleSaveProject : handleSaveComplaint} 
                  className={`flex-1 py-5 text-white font-black text-[11px] uppercase rounded-2xl shadow-2xl tracking-[0.1em] hover:scale-[1.02] active:scale-95 transition-all ${isEditing ? 'bg-amber-600 shadow-amber-100' : (showProjectModal ? 'bg-indigo-600 shadow-indigo-100' : 'bg-rose-600 shadow-rose-100')}`}
                >
                  {isEditing ? 'Valider les changements' : 'Lancer le dossier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/98 z-[3000] flex items-center justify-center p-8 cursor-pointer overflow-hidden" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full rounded-[2rem] shadow-2xl animate-in zoom-in duration-300 border-4 border-white/5" alt="Vue agrandie" />
          <div className="absolute top-10 right-10 text-white text-3xl opacity-50"><i className="fas fa-times"></i></div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
