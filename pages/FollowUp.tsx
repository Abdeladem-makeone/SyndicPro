
import React, { useState } from 'react';
import { Project, Complaint, Apartment, User } from '../types';
import { generateProjectWhatsAppLink, generateComplaintsWhatsAppLink } from '../utils/whatsappUtils';

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
  buildingName = "Ma Résidence"
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'complaints'>('projects');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  
  const isAdmin = currentUser.role === 'admin';

  const [newProject, setNewProject] = useState<Partial<Project>>({
    status: 'planned',
    priority: 'medium'
  });
  
  const [newComplaint, setNewComplaint] = useState<Partial<Complaint>>({
    status: 'open',
    priority: 'medium',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSaveProject = () => {
    if (newProject.title) {
      onAddProject({
        ...newProject,
        id: Date.now().toString(),
        authorId: isAdmin ? 'admin' : (currentUser.apartmentId || 'owner'),
        authorName: currentUser.username
      } as Project);
      setShowProjectModal(false);
      setNewProject({ status: 'planned', priority: 'medium' });
    }
  };

  const handleSaveComplaint = () => {
    if (isAdmin) {
      if (newComplaint.apartmentId && newComplaint.description) {
        const apt = apartments.find(a => a.id === newComplaint.apartmentId);
        onAddComplaint({
          ...newComplaint,
          id: Date.now().toString(),
          apartmentNumber: apt?.number || 'N/A',
          authorName: 'Syndic'
        } as Complaint);
        setShowComplaintModal(false);
        setNewComplaint({ status: 'open', priority: 'medium', date: new Date().toISOString().split('T')[0] });
      }
    } else {
      if (newComplaint.description) {
        const myApt = apartments.find(a => a.id === currentUser.apartmentId);
        onAddComplaint({
          ...newComplaint,
          id: Date.now().toString(),
          apartmentId: currentUser.apartmentId,
          apartmentNumber: myApt?.number || 'Lot Inconnu',
          authorName: currentUser.username
        } as Complaint);
        setShowComplaintModal(false);
        setNewComplaint({ status: 'open', priority: 'medium', date: new Date().toISOString().split('T')[0] });
      }
    }
  };

  const toggleComplaintSelection = (id: string) => {
    setSelectedComplaints(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleShareProject = (project: Project) => {
    const url = generateProjectWhatsAppLink(project, buildingName);
    window.open(url, '_blank');
  };

  const handleShareSelectedComplaints = () => {
    const selected = complaints.filter(c => selectedComplaints.includes(c.id));
    const url = generateComplaintsWhatsAppLink(selected, buildingName);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Suivi de la Copropriété</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Travaux, Maintenance & Dialogue</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Projets
          </button>
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'complaints' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Réclamations
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowProjectModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 flex items-center gap-3 shadow-xl shadow-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <i className="fas fa-plus-circle text-sm"></i> Proposer un projet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => {
              const canDelete = isAdmin || (project.authorId === currentUser.apartmentId);
              return (
                <div key={project.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      project.priority === 'high' ? 'bg-red-100 text-red-600' : 
                      project.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {project.priority === 'high' ? '🚨 Urgent' : project.priority === 'medium' ? '⚠️ Normal' : 'ℹ️ Basse'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleShareProject(project)} className="text-green-500 hover:scale-110 transition-transform p-2 bg-green-50 rounded-xl" title="Partager">
                        <i className="fab fa-whatsapp"></i>
                      </button>
                      {canDelete && (
                        <button onClick={() => onDeleteProject(project.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-xl">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-lg mb-3 leading-tight">{project.title}</h3>
                  <p className="text-xs text-slate-600 mb-6 flex-1 leading-relaxed opacity-80">{project.description}</p>
                  
                  <div className="pt-5 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Auteur</span>
                       <span className="text-[10px] font-bold text-indigo-600">{project.authorName}</span>
                    </div>
                    {isAdmin ? (
                       <select 
                        value={project.status}
                        onChange={(e) => onUpdateProject({...project, status: e.target.value as any})}
                        className={`text-[9px] font-black py-1.5 px-3 rounded-xl outline-none border-none shadow-inner ${
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="planned">PRÉVU</option>
                        <option value="in-progress">EN COURS</option>
                        <option value="completed">TERMINÉ</option>
                      </select>
                    ) : (
                      <span className={`text-[9px] font-black py-1.5 px-3 rounded-xl ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                         {project.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {isAdmin && selectedComplaints.length > 0 && (
                <button 
                  onClick={handleShareSelectedComplaints}
                  className="bg-green-500 text-white px-5 py-2.5 rounded-2xl hover:bg-green-600 flex items-center gap-2 shadow-lg font-black text-[10px] uppercase tracking-widest"
                >
                  <i className="fab fa-whatsapp"></i> Partager la sélection ({selectedComplaints.length})
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowComplaintModal(true)}
              className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 flex items-center justify-center gap-3 shadow-xl shadow-red-100 font-black text-[10px] uppercase tracking-widest"
            >
              <i className="fas fa-bullhorn"></i> Signaler un problème
            </button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-5 w-10">
                        <input type="checkbox" onChange={(e) => {
                            if (e.target.checked) setSelectedComplaints(complaints.map(c => c.id));
                            else setSelectedComplaints([]);
                          }}
                          checked={selectedComplaints.length === complaints.length && complaints.length > 0}
                          className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lot</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Urgence</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Auteur</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Statut</th>
                    {isAdmin && <th className="px-6 py-5 text-right"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {complaints.map(complaint => (
                    <tr key={complaint.id} className={`hover:bg-slate-50 transition-colors ${selectedComplaints.includes(complaint.id) ? 'bg-indigo-50/50' : ''}`}>
                      {isAdmin && (
                        <td className="px-6 py-5">
                          <input type="checkbox" checked={selectedComplaints.includes(complaint.id)} onChange={() => toggleComplaintSelection(complaint.id)} className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        </td>
                      )}
                      <td className="px-6 py-5"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[11px]">{complaint.apartmentNumber}</span></td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                          complaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                          complaint.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {complaint.priority === 'high' ? 'Haut' : complaint.priority === 'medium' ? 'Moyen' : 'Bas'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-700 max-w-xs truncate font-medium">{complaint.description}</td>
                      <td className="px-6 py-5 text-[10px] font-bold text-slate-400">{complaint.authorName}</td>
                      <td className="px-6 py-5 text-center">
                        {isAdmin ? (
                          <select 
                            value={complaint.status}
                            onChange={(e) => onUpdateComplaint({...complaint, status: e.target.value as any})}
                            className={`text-[9px] font-black py-1.5 px-3 rounded-xl outline-none border-none shadow-inner ${
                              complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              complaint.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="open">OUVERT</option>
                            <option value="pending">EN ATTENTE</option>
                            <option value="resolved">RÉSOLU</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] font-black py-1.5 px-3 rounded-xl ${
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {complaint.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => onDeleteComplaint(complaint.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl">
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {complaints.length === 0 && (
                    <tr><td colSpan={isAdmin ? 7 : 5} className="p-20 text-center text-slate-400 font-bold italic">Aucune réclamation enregistrée.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals with enhanced UI */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800">Proposer un projet</h3>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre de l'initiative</label>
                <input placeholder="Ex: Remplacement des spots LED" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={newProject.title || ''} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description détaillée</label>
                <textarea placeholder="Pourquoi ce projet est-il important ?" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={newProject.description || ''} onChange={(e) => setNewProject({...newProject, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorité</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={newProject.priority} onChange={(e) => setNewProject({...newProject, priority: e.target.value as any})}>
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Urgent</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Est. (DH)</label>
                    <input type="number" placeholder="0.00" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={newProject.estimatedBudget || ''} onChange={(e) => setNewProject({...newProject, estimatedBudget: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowProjectModal(false)} className="flex-1 py-4 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-2xl border transition-all">ANNULER</button>
              <button onClick={handleSaveProject} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest">ENREGISTRER</button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800">Signaler un problème</h3>
            <div className="space-y-5">
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appartement concerné</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={newComplaint.apartmentId || ''} onChange={(e) => setNewComplaint({...newComplaint, apartmentId: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>{apt.number} - {apt.owner}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Niveau d'urgence</label>
                <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={newComplaint.priority} onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value as any})}>
                  <option value="low">Bas (Simple signalement)</option>
                  <option value="medium">Moyen (Sérieux)</option>
                  <option value="high">Haut (Dégât / Danger)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description du dysfonctionnement</label>
                <textarea placeholder="Ex: Fuite d'eau dans le garage, panne d'ascenseur..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" rows={5} value={newComplaint.description || ''} onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowComplaintModal(false)} className="flex-1 py-4 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-2xl border transition-all uppercase tracking-widest">ANNULER</button>
              <button onClick={handleSaveComplaint} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest">ENVOYER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
