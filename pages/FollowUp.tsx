
import React, { useState, useMemo } from 'react';
import { Project, Complaint, Apartment, User, Attachment, ExpenseCategory } from '../types';
import { storage } from '../utils/storage';

interface FollowUpProps {
  apartments: Apartment[];
  projects: Project[];
  complaints: Complaint[];
  currentUser: User;
  onRefresh: () => void;
  language?: 'fr' | 'ar';
}

const FollowUp: React.FC<FollowUpProps> = ({
  apartments,
  projects,
  complaints,
  currentUser,
  onRefresh,
  language = 'fr'
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'complaints'>('projects');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'project' | 'complaint', data: any } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ type: 'project' | 'complaint', data: any } | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isAr = language === 'ar';

  const translations = {
    fr: {
      title: 'Opérations & Suivi',
      desc: 'Gestion des incidents et projets de la copropriété',
      tabProjects: 'Projets',
      tabComplaints: 'Réclamations',
      newProject: 'Nouveau Projet',
      newComplaint: 'Nouvelle Réclamation',
      editItem: 'Modifier l\'élément',
      deleteConfirm: 'Supprimer définitivement cet élément ?',
      status: 'Statut',
      priority: 'Priorité',
      descLabel: 'Description',
      close: 'Fermer',
      confirm: 'Enregistrer',
      cancel: 'Annuler',
      titleLabel: 'Titre / Sujet',
      priorityLow: 'Basse',
      priorityMed: 'Moyenne',
      priorityHigh: 'Haute',
      send: 'Créer',
      placeholderDesc: 'Détails de l\'intervention ou du projet...',
      assignTo: 'Attribution',
      building: 'Immeuble (Parties Communes)',
      apartment: 'Appartement spécifique',
      files: 'Fichiers joints',
      maxSize: 'Max 10 Mo au total',
      noItems: 'Aucun enregistrement trouvé'
    },
    ar: {
      title: 'العمليات والمتابعة',
      desc: 'تدبير الحوادث ومشاريع الملكية المشتركة',
      tabProjects: 'المشاريع',
      tabComplaints: 'الشكايات',
      newProject: 'مشروع جديد',
      newComplaint: 'شكاية جديدة',
      editItem: 'تعديل',
      deleteConfirm: 'هل أنت متأكد من الحذف؟',
      status: 'الحالة',
      priority: 'الأولوية',
      descLabel: 'الوصف',
      close: 'إغلاق',
      confirm: 'حفظ',
      cancel: 'إلغاء',
      titleLabel: 'العنوان',
      priorityLow: 'منخفضة',
      priorityMed: 'متوسطة',
      priorityHigh: 'عالية',
      send: 'إنشاء',
      placeholderDesc: 'تفاصيل التدخل أو المشروع...',
      assignTo: 'التعيين',
      building: 'العمارة (الأجزاء المشتركة)',
      apartment: 'شقة محددة',
      files: 'الملفات المرفقة',
      maxSize: 'الأقصى 10 ميجا',
      noItems: 'لا توجد سجلات'
    }
  };

  const t = translations[language];

  // États pour les formulaires
  const [formType, setFormType] = useState<'building' | 'apartment'>('building');
  const [selectedAptId, setSelectedAptId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    title: '', description: '', priority: 'medium', status: 'planned', estimatedBudget: 0
  });

  const [complaintForm, setComplaintForm] = useState<Partial<Complaint>>({
    description: '', priority: 'medium', category: ExpenseCategory.OTHER, status: 'open'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Casting files as File[] to prevent TypeScript unknown type errors
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      alert("La taille totale des fichiers ne doit pas dépasser 10 Mo.");
      return;
    }

    setIsUploading(true);
    const promises = files.map(file => {
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            data: event.target?.result as string,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newAttachments => {
      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
    });
  };

  const handleSave = () => {
    const { projects: curProjects, complaints: curComplaints } = storage.loadOperations();
    
    if (activeTab === 'projects') {
      if (!projectForm.title || !projectForm.description) return alert("Champs obligatoires manquants");
      const itemToSave: Project = {
        ...(editingItem?.data || {}),
        ...projectForm as Project,
        id: editingItem?.data?.id || `p-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.username,
        attachments: attachments
      };

      const updated = editingItem 
        ? curProjects.map((p: Project) => p.id === itemToSave.id ? itemToSave : p)
        : [itemToSave, ...curProjects];
      
      storage.saveOperations(updated, curComplaints);
    } else {
      if (!complaintForm.description) return alert("Description obligatoire");
      
      const apt = apartments.find(a => a.id === selectedAptId);
      const itemToSave: Complaint = {
        ...(editingItem?.data || {}),
        ...complaintForm as Complaint,
        id: editingItem?.data?.id || `c-${Date.now()}`,
        apartmentId: formType === 'building' ? 'building' : selectedAptId,
        apartmentNumber: formType === 'building' ? 'Parties Communes' : (apt?.number || '?'),
        date: editingItem?.data?.date || new Date().toISOString(),
        authorName: editingItem?.data?.authorName || currentUser.username,
        attachments: attachments
      };

      const updated = editingItem
        ? curComplaints.map((c: Complaint) => c.id === itemToSave.id ? itemToSave : c)
        : [itemToSave, ...curComplaints];

      storage.saveOperations(curProjects, updated);
    }

    resetForm();
    onRefresh();
  };

  const handleDelete = (id: string, type: 'projects' | 'complaints') => {
    if (!confirm(t.deleteConfirm)) return;
    const { projects: curP, complaints: curC } = storage.loadOperations();
    if (type === 'projects') {
      storage.saveOperations(curP.filter((p: Project) => p.id !== id), curC);
    } else {
      storage.saveOperations(curP, curC.filter((c: Complaint) => c.id !== id));
    }
    onRefresh();
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setAttachments([]);
    setProjectForm({ title: '', description: '', priority: 'medium', status: 'planned', estimatedBudget: 0 });
    setComplaintForm({ description: '', priority: 'medium', category: ExpenseCategory.OTHER, status: 'open' });
    setSelectedAptId('');
    setFormType('building');
  };

  const handleEdit = (item: any, type: 'project' | 'complaint') => {
    setEditingItem({ type, data: item });
    setAttachments(item.attachments || []);
    if (type === 'project') {
      setProjectForm(item);
    } else {
      setComplaintForm(item);
      setFormType(item.apartmentId === 'building' ? 'building' : 'apartment');
      setSelectedAptId(item.apartmentId !== 'building' ? item.apartmentId : '');
    }
    setShowAddModal(true);
  };

  const currentItems = activeTab === 'projects' ? projects : complaints;

  return (
    <div className="space-y-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className={`font-black text-slate-800 tracking-tight ${isAr ? 'text-4xl' : 'text-3xl'}`}>{t.title}</h2>
          <p className={`font-black uppercase mt-1 tracking-widest opacity-60 text-slate-500 ${isAr ? 'text-xs' : 'text-[10px]'}`}>{t.desc}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button 
              onClick={() => setActiveTab('projects')} 
              className={`px-6 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[10px]'}`}
             >
               {t.tabProjects}
             </button>
             <button 
              onClick={() => setActiveTab('complaints')} 
              className={`px-6 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all ${activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'} ${isAr ? 'text-sm' : 'text-[10px]'}`}
             >
               {t.tabComplaints}
             </button>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> {activeTab === 'projects' ? t.newProject : t.newComplaint}
            </button>
          )}
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentItems.map(item => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
               <span className={`px-3 py-1 rounded-lg font-black uppercase tracking-widest ${
                 item.status === 'completed' || item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 
                 item.status === 'in-progress' || item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
               } ${isAr ? 'text-xs' : 'text-[9px]'}`}>
                 {item.status}
               </span>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item, activeTab === 'projects' ? 'project' : 'complaint')} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={() => handleDelete(item.id, activeTab)} className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash text-xs"></i></button>
               </div>
            </div>

            <div className="flex-1 space-y-3 cursor-pointer" onClick={() => setViewingItem({ type: activeTab === 'projects' ? 'project' : 'complaint', data: item })}>
               <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${activeTab === 'complaints' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    <i className={`fas ${activeTab === 'complaints' ? 'fa-triangle-exclamation' : 'fa-helmet-safety'}`}></i>
                 </div>
                 <h3 className={`font-black text-slate-800 line-clamp-1 ${isAr ? 'text-lg' : 'text-sm'}`}>
                   {activeTab === 'complaints' ? (item as Complaint).category : (item as Project).title}
                 </h3>
               </div>
               
               <p className={`text-slate-500 font-medium leading-relaxed line-clamp-2 ${isAr ? 'text-base' : 'text-xs'}`}>
                 {activeTab === 'complaints' ? (item as Complaint).description : (item as Project).description}
               </p>

               <div className="flex flex-wrap gap-2 pt-2">
                  <span className={`px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                    item.priority === 'high' ? 'bg-rose-100 text-rose-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  } ${isAr ? 'text-[10px]' : 'text-[8px]'}`}>
                    {item.priority}
                  </span>
                  {item.attachments && item.attachments.length > 0 && (
                    <span className={`bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-black uppercase ${isAr ? 'text-[10px]' : 'text-[8px]'}`}><i className="fas fa-paperclip mr-1"></i> {item.attachments.length}</span>
                  )}
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase text-slate-400">
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center"><i className="fas fa-user text-[8px]"></i></div>
                  <span className={isAr ? 'text-[10px]' : ''}>{item.authorName}</span>
               </div>
               <span className={isAr ? 'text-[10px]' : ''}>{activeTab === 'complaints' ? (item as Complaint).apartmentNumber : (item as Project).estimatedBudget ? `${(item as Project).estimatedBudget} DH` : ''}</span>
            </div>
          </div>
        ))}
        {currentItems.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
             <i className="fas fa-folder-open text-4xl text-slate-200 mb-4"></i>
             <p className={`font-black uppercase tracking-widest text-slate-300 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.noItems}</p>
          </div>
        )}
      </div>

      {/* VIEW MODAL (AJUSTEMENT POLICE ARABE) */}
      {viewingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingItem(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm ${viewingItem.type === 'complaint' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                   <i className={`fas ${viewingItem.type === 'complaint' ? 'fa-triangle-exclamation' : 'fa-helmet-safety'}`}></i>
                </div>
                <button onClick={() => setViewingItem(null)} className="text-slate-300 hover:text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                <div>
                   <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 inline-block">ID: {viewingItem.data.id}</span>
                   <h3 className={`font-black text-slate-800 leading-tight ${isAr ? 'text-3xl' : 'text-2xl'}`}>
                     {viewingItem.type === 'complaint' ? viewingItem.data.category : viewingItem.data.title}
                   </h3>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className={`text-slate-600 leading-relaxed font-medium whitespace-pre-wrap ${isAr ? 'text-lg' : 'text-sm'}`}>
                     {viewingItem.data.description}
                   </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   <div className="space-y-1">
                      <p className={`font-black text-slate-400 uppercase ${isAr ? 'text-sm' : 'text-[8px]'}`}>Statut</p>
                      <p className={`font-black text-slate-700 uppercase ${isAr ? 'text-base' : 'text-[10px]'}`}>{viewingItem.data.status}</p>
                   </div>
                   <div className="space-y-1">
                      <p className={`font-black text-slate-400 uppercase ${isAr ? 'text-sm' : 'text-[8px]'}`}>Priorité</p>
                      <p className={`font-black text-slate-700 uppercase ${isAr ? 'text-base' : 'text-[10px]'}`}>{viewingItem.data.priority}</p>
                   </div>
                   <div className="space-y-1">
                      <p className={`font-black text-slate-400 uppercase ${isAr ? 'text-sm' : 'text-[8px]'}`}>Auteur</p>
                      <p className={`font-black text-slate-700 uppercase ${isAr ? 'text-base' : 'text-[10px]'}`}>{viewingItem.data.authorName}</p>
                   </div>
                   <div className="space-y-1">
                      <p className={`font-black text-slate-400 uppercase ${isAr ? 'text-sm' : 'text-[8px]'}`}>Référence</p>
                      <p className={`font-black text-slate-700 uppercase ${isAr ? 'text-base' : 'text-[10px]'}`}>{viewingItem.type === 'complaint' ? viewingItem.data.apartmentNumber : `${viewingItem.data.estimatedBudget || 0} DH`}</p>
                   </div>
                </div>

                {viewingItem.data.attachments && viewingItem.data.attachments.length > 0 && (
                   <div className="space-y-3 pt-4 border-t">
                      <p className={`font-black text-slate-400 uppercase tracking-widest ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.files}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {viewingItem.data.attachments.map((file: Attachment, i: number) => (
                            <a 
                              key={i} 
                              href={file.data} 
                              download={file.name}
                              className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition-all group"
                            >
                               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm group-hover:text-indigo-600">
                                  <i className="fas fa-file-arrow-down text-xs"></i>
                               </div>
                               <span className={`font-bold text-slate-500 truncate ${isAr ? 'text-xs' : 'text-[10px]'}`}>{file.name}</span>
                            </a>
                         ))}
                      </div>
                   </div>
                )}
             </div>
             
             <div className="p-6 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setViewingItem(null)} className={`px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.close}</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT (LES LABELS ET SELECTS) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetForm}></div>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${activeTab === 'projects' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                    <i className={`fas ${activeTab === 'projects' ? 'fa-helmet-safety' : 'fa-triangle-exclamation'}`}></i>
                  </div>
                  <div>
                    <h3 className={`font-black text-slate-800 tracking-tight ${isAr ? 'text-2xl' : 'text-lg'}`}>{editingItem ? t.editItem : (activeTab === 'projects' ? t.newProject : t.newComplaint)}</h3>
                    <p className={`font-bold uppercase ${isAr ? 'text-xs' : 'text-[9px]'} text-slate-400`}>{t.desc}</p>
                  </div>
               </div>
               <button onClick={resetForm} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {activeTab === 'complaints' && (
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setFormType('building')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest border transition-all ${formType === 'building' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'} ${isAr ? 'text-base' : 'text-[10px]'}`}
                      >
                        {t.building}
                      </button>
                      <button 
                        onClick={() => setFormType('apartment')}
                        className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest border transition-all ${formType === 'apartment' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'} ${isAr ? 'text-base' : 'text-[10px]'}`}
                      >
                        {t.apartment}
                      </button>
                   </div>
                   
                   {formType === 'apartment' && (
                     <div className="space-y-1">
                        <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>Appartement concerné</label>
                        <select 
                          value={selectedAptId} 
                          onChange={e => setSelectedAptId(e.target.value)}
                          className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all ${isAr ? 'text-lg' : 'text-sm'}`}
                        >
                          <option value="">Sélectionner...</option>
                          {apartments.map(a => <option key={a.id} value={a.id}>Appt {a.number} - {a.owner}</option>)}
                        </select>
                     </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>Catégorie d'incident</label>
                         <select 
                            value={complaintForm.category} 
                            onChange={e => setComplaintForm({...complaintForm, category: e.target.value as ExpenseCategory})}
                            className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-rose-600 outline-none ${isAr ? 'text-lg' : 'text-sm'}`}
                         >
                            {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.status}</label>
                         <select 
                            value={complaintForm.status} 
                            onChange={e => setComplaintForm({...complaintForm, status: e.target.value as any})}
                            className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-rose-600 outline-none ${isAr ? 'text-lg' : 'text-sm'}`}
                         >
                            <option value="open">Ouvert</option>
                            <option value="pending">En attente</option>
                            <option value="resolved">Résolu</option>
                         </select>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.titleLabel}</label>
                    <input 
                      type="text" 
                      value={projectForm.title} 
                      onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                      className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none ${isAr ? 'text-lg' : 'text-sm'}`} 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.status}</label>
                       <select 
                          value={projectForm.status} 
                          onChange={e => setProjectForm({...projectForm, status: e.target.value as any})}
                          className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none ${isAr ? 'text-lg' : 'text-sm'}`}
                       >
                          <option value="planned">Prévu</option>
                          <option value="in-progress">En cours</option>
                          <option value="completed">Terminé</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>Budget Estimé (DH)</label>
                       <input 
                         type="number" 
                         value={projectForm.estimatedBudget} 
                         onChange={e => setProjectForm({...projectForm, estimatedBudget: parseInt(e.target.value) || 0})}
                         className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-600 outline-none ${isAr ? 'text-lg' : 'text-sm'}`} 
                       />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.descLabel}</label>
                <textarea 
                  rows={4}
                  value={activeTab === 'projects' ? projectForm.description : complaintForm.description} 
                  onChange={e => activeTab === 'projects' ? setProjectForm({...projectForm, description: e.target.value}) : setComplaintForm({...complaintForm, description: e.target.value})}
                  placeholder={t.placeholderDesc}
                  className={`w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-slate-300 outline-none transition-all ${isAr ? 'text-lg' : 'text-sm'}`}
                />
              </div>

              <div className="space-y-3">
                 <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.priority}</label>
                 <div className="grid grid-cols-3 gap-3">
                   {(['low', 'medium', 'high'] as const).map(p => (
                     <button 
                      key={p} 
                      onClick={() => activeTab === 'projects' ? setProjectForm({...projectForm, priority: p}) : setComplaintForm({...complaintForm, priority: p})}
                      className={`py-3 rounded-xl font-black uppercase tracking-widest border transition-all ${
                        (activeTab === 'projects' ? projectForm.priority : complaintForm.priority) === p 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                      } ${isAr ? 'text-base' : 'text-[9px]'}`}
                     >
                       {p === 'low' ? t.priorityLow : p === 'medium' ? t.priorityMed : t.priorityHigh}
                     </button>
                   ))}
                 </div>
              </div>

              {/* ATTACHMENTS SECTION */}
              <div className="space-y-4 pt-4 border-t">
                 <div className="flex items-center justify-between">
                    <label className={`font-black text-slate-400 uppercase tracking-widest ml-1 ${isAr ? 'text-sm' : 'text-[10px]'}`}>{t.files}</label>
                    <span className="text-[8px] font-bold text-slate-400 italic">{t.maxSize}</span>
                 </div>
                 
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="aspect-square bg-slate-100 rounded-xl border border-slate-200 relative group overflow-hidden">
                         {file.type.startsWith('image/') ? (
                           <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="fas fa-file text-xl"></i></div>
                         )}
                         <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-md flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
                      </div>
                    ))}
                    <label className={`aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-400 cursor-pointer transition-all ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}>
                       <input type="file" multiple onChange={handleFileChange} className="hidden" />
                       <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-lg`}></i>
                       <span className={`font-black mt-2 uppercase tracking-tighter ${isAr ? 'text-sm' : 'text-[8px]'}`}>Ajouter</span>
                    </label>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={resetForm} className={`flex-1 py-3 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.cancel}</button>
              <button onClick={handleSave} className={`flex-2 px-10 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ${isAr ? 'text-base' : 'text-[10px]'}`}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
