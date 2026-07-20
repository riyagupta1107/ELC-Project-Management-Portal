import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DOMAINS = [
  "Web Development", "App Development", "Machine Learning / AI", "Data Science", 
  "Internet of Things (IoT)", "Cybersecurity", "Cloud Computing", "Blockchain", 
  "Augmented / Virtual Reality", "Embedded Systems", "Robotics", 
  "VLSI / Hardware Design", "Networking", "Game Development", "Other"
];

function ManageProject() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth(); // NEW: Hook into JWT auth state
  
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FETCH PROJECT & APPLICATIONS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, appsRes] = await Promise.all([
          axiosInstance.get(`/projects/${id}`),
          axiosInstance.get(`/applications/project/${id}`)
        ]);

        setProject(projectRes.data);
        setApplications(appsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load project details or applications.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [id, user]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', students: 1, domain: [] });

  const openEditModal = () => {
    setEditForm({
      title: project.title,
      description: project.description,
      students: project.students,
      domain: project.domain || []
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(`/projects/${id}`, editForm);
      
      setProject(res.data);
      setIsEditModalOpen(false); 
      toast.success("Project details updated successfully!");
    } catch (err) {
      console.error("Error editing project:", err);
      toast.error("Failed to update project.");
    }
  };

  const handleAddDomain = (e) => {
    const selectedDomain = e.target.value;
    if (selectedDomain && !editForm.domain.includes(selectedDomain)) {
      setEditForm(prev => ({ ...prev, domain: [...prev.domain, selectedDomain] }));
    }
    e.target.value = "";
  };

  const removeDomain = (domainToRemove) => {
    setEditForm(prev => ({ ...prev, domain: prev.domain.filter(d => d !== domainToRemove) }));
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/applications/${applicationId}/status`, { status: newStatus });

      setApplications(prevApps => 
        prevApps.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      if (response.data.project) setProject(response.data.project);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update application status.");
    }
  };

  const handleMarkCompleted = async () => {
    if (!window.confirm("Are you sure you want to mark this project as Completed? It will be moved to past projects.")) return;
    try {
      await axiosInstance.put(`/projects/${id}`, { status: "Completed" });
      setProject(prev => ({ ...prev, status: "Completed" }));
      toast.success("Project successfully marked as completed!");
    } catch (err) {
      console.error("Error completing project:", err);
      toast.error("Failed to update project status.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete this project? All student applications will be lost. This cannot be undone.")) return;
    try {
      await axiosInstance.delete(`/projects/${id}`);
      toast.success("Project deleted successfully.");
      navigate('/faculty-dashboard'); 
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project.");
    }
  };

  if (loading) return <div className="min-h-screen bg-offWhite flex justify-center items-center text-gray-500 font-medium animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="min-h-screen bg-offWhite flex justify-center items-center text-red-500">{error}</div>;
  if (!project) return null;

  const pendingApps = applications.filter(app => app.status === "Pending");
  const processedApps = applications.filter(app => app.status !== "Pending");

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/faculty-dashboard')} className="flex items-center text-sm font-medium text-gray-500 hover:text-brickRed transition-colors mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold tracking-wide uppercase mb-3 inline-block">Manage Project</span>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{project.title}</h1>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <div className="bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 text-center min-w-[150px]">
                <p className="text-sm font-medium text-gray-500 mb-1">Capacity</p>
                <p className="text-2xl font-bold text-gray-800">
                  <span className="text-brickRed">{project.enrolledStudents?.length || 0}</span> / {project.students}
                </p>
              </div>
              
              {project.status === "Ongoing" && (
                <button onClick={handleMarkCompleted} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                  Mark as Completed
                </button>
              )}
              <button onClick={handleDeleteProject} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg text-sm border border-red-200 transition-colors shadow-sm">
                Delete Project
              </button>
              <button onClick={openEditModal} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 px-4 rounded-lg text-sm border border-blue-200 transition-colors shadow-sm">
                Edit Project Details
              </button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            Needs Review ({pendingApps.length})
          </h2>

          {pendingApps.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
              No pending applications at the moment.
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingApps.map(app => (
                <div key={app._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{app.studentName}</h3>
                    <p className="text-sm text-gray-500 mb-3">{app.studentEmail}</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic border border-gray-100">
                      "{app.message}"
                    </div>
                    {app.resumeLink && (
                      <a href={app.resumeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:underline">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        View Resume/Portfolio
                      </a>
                    )}
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-32 shrink-0">
                    <button onClick={() => handleUpdateStatus(app._id, "Accepted")} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm text-center shadow-sm">
                      Accept
                    </button>
                    <button onClick={() => handleUpdateStatus(app._id, "Rejected")} className="flex-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-2 px-4 rounded-lg transition-colors text-sm text-center border border-gray-200 hover:border-red-200">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {processedApps.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 opacity-75">Processed History ({processedApps.length})</h2>
            <div className="grid gap-3 opacity-80">
              {processedApps.map(app => (
                <div key={app._id} className="bg-white rounded-lg border border-gray-100 p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">{app.studentName}</h4>
                    <p className="text-xs text-gray-500">{app.studentEmail}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Project Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Title</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domains</label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white focus:border-brickRed" onChange={handleAddDomain} defaultValue="">
                  <option value="" disabled>Select a Domain...</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.domain.map((d, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-brickRed border border-red-200">
                      {d}
                      <button type="button" onClick={() => removeDomain(d)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea required rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Capacity</label>
                <input type="number" min="1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={editForm.students} onChange={(e) => setEditForm({...editForm, students: e.target.value})}/>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-brickRed text-white py-2 rounded-lg font-bold hover:bg-red-800 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProject;
