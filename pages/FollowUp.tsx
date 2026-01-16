
import React, { useState } from 'react';
import { Project, Complaint, Apartment } from '../types';
import { generateProjectWhatsAppLink, generateComplaintsWhatsAppLink } from '../utils/whatsappUtils';

interface FollowUpProps {
  apartments: Apartment[];
  projects: Project[];
  complaints: Complaint[];
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
        id: Date.now().toString()
      } as Project);
      setShowProjectModal(false);
      setNewProject({ status: 'planned', priority: 'medium' });
    }
  };

  const handleSaveComplaint = () => {
    if (newComplaint.apartmentId && newComplaint.description) {
      const apt = apartments.find(a => a.id === newComplaint.apartmentId);
      onAddComplaint({
        ...newComplaint,
        id: Date.now().toString(),
        apartmentNumber: apt?.number || 'N/A'
      } as Complaint);
      setShowComplaintModal(false);
      setNewComplaint({ status: 'open', priority: 'medium', date: new Date().toISOString().split('T')[0] });
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
          <h2 className="text-2xl font-bold text-slate-800">Suivi & Projets</h2>
          <p className="text-slate-500 text-sm">Suivez les travaux et partagez les urgences via WhatsApp.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Projets
          </button>
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'complaints' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Réclamations
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowProjectModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all"
            >
              <i className="fas fa-plus"></i> Nouveau Projet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    project.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    project.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {project.priority === 'high' ? 'Urgent' : project.priority === 'medium' ? 'Normal' : 'Basse'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShareProject(project)}
                      className="text-green-500 hover:text-green-600 p-1"
                      title="Partager le projet via WhatsApp"
                    >
                      <i className="fab fa-whatsapp"></i>
                    </button>
                    <button 
                      onClick={() => onDeleteProject(project.id)} 
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-2">{project.title}</h3>
                <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-3">{project.description}</p>
                
                <div className="pt-4 border-t flex items-center justify-between mt-auto">
                  <select 
                    value={project.status}
                    onChange={(e) => onUpdateProject({...project, status: e.target.value as any})}
                    className={`text-xs font-bold py-1 px-2 rounded-lg outline-none border-none ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <option value="planned">Prévu</option>
                    <option value="in-progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                  {project.estimatedBudget && (
                    <span className="text-xs font-black text-slate-800">{project.estimatedBudget.toLocaleString()} DH</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {selectedComplaints.length > 0 && (
                <button 
                  onClick={handleShareSelectedComplaints}
                  className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 flex items-center gap-2 shadow-lg font-bold text-xs"
                >
                  <i className="fab fa-whatsapp"></i> Partager la sélection ({selectedComplaints.length})
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowComplaintModal(true)}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm font-bold"
            >
              <i className="fas fa-bullhorn"></i> Signaler un problème
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedComplaints(complaints.map(c => c.id));
                          else setSelectedComplaints([]);
                        }}
                        checked={selectedComplaints.length === complaints.length && complaints.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Lot</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Urgence</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Statut</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map(complaint => (
                    <tr key={complaint.id} className={`hover:bg-slate-50 ${selectedComplaints.includes(complaint.id) ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedComplaints.includes(complaint.id)}
                          onChange={() => toggleComplaintSelection(complaint.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-black text-indigo-600">{complaint.apartmentNumber}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                          complaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                          complaint.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {complaint.priority === 'high' ? 'Urgent' : complaint.priority === 'medium' ? 'Normal' : 'Bas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 max-w-md truncate">{complaint.description}</td>
                      <td className="px-6 py-4 text-center">
                        <select 
                          value={complaint.status}
                          onChange={(e) => onUpdateComplaint({...complaint, status: e.target.value as any})}
                          className={`text-[10px] font-black py-1 px-2 rounded-lg outline-none border-none ${
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <option value="open">OUVERT</option>
                          <option value="pending">EN ATTENTE</option>
                          <option value="resolved">RÉSOLU</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => onDeleteComplaint(complaint.id)} className="text-slate-300 hover:text-red-500">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Nouveau Projet</h3>
            <div className="space-y-4">
              <input 
                placeholder="Titre du projet"
                className="w-full px-4 py-2 border rounded-xl"
                value={newProject.title || ''}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
              />
              <textarea 
                placeholder="Description"
                className="w-full px-4 py-2 border rounded-xl"
                rows={3}
                value={newProject.description || ''}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="px-4 py-2 border rounded-xl"
                  value={newProject.priority}
                  onChange={(e) => setNewProject({...newProject, priority: e.target.value as any})}
                >
                  <option value="low">Basse</option>
                  <option value="medium">Normale</option>
                  <option value="high">Haute</option>
                </select>
                <input 
                  type="number"
                  placeholder="Budget (DH)"
                  className="px-4 py-2 border rounded-xl"
                  value={newProject.estimatedBudget || ''}
                  onChange={(e) => setNewProject({...newProject, estimatedBudget: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowProjectModal(false)} className="flex-1 py-2 border rounded-xl">Annuler</button>
              <button onClick={handleSaveProject} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Signaler une réclamation</h3>
            <div className="space-y-4">
              <select 
                className="w-full px-4 py-2 border rounded-xl"
                value={newComplaint.apartmentId || ''}
                onChange={(e) => setNewComplaint({...newComplaint, apartmentId: e.target.value})}
              >
                <option value="">Sélectionner l'appartement</option>
                {apartments.map(apt => (
                  <option key={apt.id} value={apt.id}>{apt.number} - {apt.owner}</option>
                ))}
              </select>
              <select 
                className="w-full px-4 py-2 border rounded-xl"
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value as any})}
              >
                <option value="low">Bas (Normal)</option>
                <option value="medium">Moyen (Sérieux)</option>
                <option value="high">Haut (Urgent)</option>
              </select>
              <textarea 
                placeholder="Description du problème"
                className="w-full px-4 py-2 border rounded-xl"
                rows={4}
                value={newComplaint.description || ''}
                onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowComplaintModal(false)} className="flex-1 py-2 border rounded-xl">Annuler</button>
              <button onClick={handleSaveComplaint} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
