import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../components/TopNavbar';
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext'; // NEW: Imported AuthContext
import toast from 'react-hot-toast';

// --- CONSTANTS ---
const DOMAINS = [
  "Web Development", "App Development", "Machine Learning / AI",
  "Data Science", "Internet of Things (IoT)", "Cybersecurity",
  "Cloud Computing", "Blockchain", "Augmented / Virtual Reality",
  "Embedded Systems", "Robotics", "VLSI / Hardware Design",
  "Networking", "Game Development", "Other"
];

function ProfessorDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth(); // NEW: Hooked into JWT auth state

  const [greeting, setGreeting] = useState('');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Notice & Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form State for New Project
  const [newProject, setNewProject] = useState({
    title: '', domain: [], description: '', students: 0, status: 'Ongoing'
  });
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftSuggestion, setDraftSuggestion] = useState('');
  const [draftSuggestedDomains, setDraftSuggestedDomains] = useState([]);
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState(null);
  const [draftError, setDraftError] = useState('');
  const [showDraftCard, setShowDraftCard] = useState(false);

  // --- 1. FETCH PROJECTS FROM DB ---
  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("/api/projects/my-prof-projects");
      setProjects(response.data); 
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false); 
    }
  };

  // --- 2. HANDLE NOTIFICATIONS ---
  useEffect(() => {
    const fetchNotifications = async () => {
        try {
            const res = await axiosInstance.get('/api/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    if (user) fetchNotifications();

    if (socket) {
        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };
        socket.on("newNotification", handleNewNotification);
        return () => socket.off("newNotification", handleNewNotification);
      }
  }, [socket, user]); 

  // --- 3. HANDLE INITIAL LOAD ---
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setLoading(false);
    }
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [user]);

  // --- 4. HANDLE DOMAIN SELECTION ---
  const handleAddDomain = (e) => {
    const selectedDomain = e.target.value;
    if (selectedDomain && !newProject.domain.includes(selectedDomain)) {
      setNewProject({ ...newProject, domain: [...newProject.domain, selectedDomain] });
    }
    e.target.value = "";
  };

  const removeDomain = (domainToRemove) => {
    setNewProject({
      ...newProject,
      domain: newProject.domain.filter(d => d !== domainToRemove) 
    });
  };

  // --- 5. DRAFT & SUBMIT ---
  const handleGenerateDraft = async () => {
    const rawInput = draftPrompt.trim() || newProject.description.trim();
    if (!rawInput) {
      setDraftError("Type some initial description text first, then click Reform with AI.");
      return;
    }
    if (!user) {
      setDraftError("Please sign in again before using Magic Draft.");
      return;
    }

    setDrafting(true);
    setDraftError('');
    setDraftResult(null);

    try {
      const response = await axiosInstance.post("/api/projects/draft", { rawInput });
      setDraftResult(response.data);
      setDraftSuggestion(response.data.description || '');
      setDraftSuggestedDomains(response.data.domains || []);
      setShowDraftCard(true);
    } catch (error) {
      setDraftError(error?.response?.data?.message || error.message || "Failed to generate draft.");
    } finally {
      setDrafting(false);
    }
  };

  const handleAcceptDraft = () => {
    if (!draftSuggestion.trim()) return;
    setNewProject(prev => ({
      ...prev,
      description: draftSuggestion,
      domain: Array.from(new Set([...(prev.domain || []), ...draftSuggestedDomains]))
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await axiosInstance.post("/api/projects/add", newProject);
      setProjects([response.data, ...projects]); 
      setIsModalOpen(false); 
      setNewProject({ title: '', domain:[], description: '', students: 0, status: 'Ongoing' }); 
      toast.success("Project Created Successfully!");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const ongoingProjects = projects.filter(p => p.status === "Ongoing");
  const pastProjects = projects.filter(p => p.status === "Completed");

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 relative">
      <TopNavbar subtitle="FACULTY DASHBOARD" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 md:p-0 p-4">
          <div>
            <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
            <h1 className="text-5xl font-bold text-brickRed mt-1">Prof. {user?.lastName || 'Faculty'}.</h1>
            <p className="mt-2 text-gray-600">You have <span className="font-bold text-brickRed">{ongoingProjects.length} active projects</span>.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setShowDraftCard(false);
              setDraftResult(null);
            }}
            className="bg-brickRed w-max hover:bg-red-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-semibold transition"
          >
            + Create New Project
          </button>
        </div>

        <hr className="border-gray-300 mb-10" />

        {/* LOADING STATE */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your projects...</div>
        ) : (
          <>
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                Ongoing Projects
              </h3>

              {ongoingProjects.length === 0 && (
                <p className="text-gray-500 italic">No ongoing projects. Click "Create New" to start one.</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoingProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </section>

            {pastProjects.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 opacity-75">Past Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                  {pastProjects.map((project) => (
                    <ProjectCard key={project._id} project={project} isPast={true} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* CREATE MODAL REMAINS THE SAME (Unchanged HTML Structure) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Project</h2>
            
            <div className={showDraftCard ? "grid gap-6 xl:grid-cols-[1.7fr_1fr]" : "space-y-4"}>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Title</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domains</label>
                  <select className="block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed bg-white" onChange={handleAddDomain} defaultValue="">
                    <option value="" disabled>Select a Domain...</option>
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProject.domain.map((d, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-brickRed border border-red-200">
                        {d}
                        <button type="button" onClick={() => removeDomain(d)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <button type="button" onClick={() => { setDraftPrompt(newProject.description || ''); setShowDraftCard(true); }} className="text-sm text-brickRed font-semibold hover:underline">Reform with AI</button>
                  </div>
                  <textarea required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Students Needed</label>
                    <input type="number" min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={newProject.students} onChange={(e) => setNewProject({...newProject, students: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={newProject.status} onChange={(e) => setNewProject({...newProject, status: e.target.value})}>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-brickRed text-white py-2 rounded-lg font-bold hover:bg-red-800 transition">Save Project</button>
              </form>

              {showDraftCard && (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                  {draftError && <p className="mt-2 text-sm text-red-600">{draftError}</p>}
                  <button type="button" onClick={handleGenerateDraft} disabled={drafting} className="mt-1 w-full bg-brickRed text-white py-2 rounded-xl font-semibold hover:bg-red-800 transition disabled:opacity-60">
                    {drafting ? 'Generating suggestion...' : 'Refine description with AI'}
                  </button>
                  {draftResult && (
                    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Suggested Description</h4>
                        <textarea rows="5" value={draftSuggestion} onChange={(e) => setDraftSuggestion(e.target.value)} className="mt-3 block w-full rounded-xl border-gray-300 shadow-sm border p-3 focus:border-brickRed focus:ring-brickRed" />
                      </div>
                      <button type="button" onClick={handleAcceptDraft} className="w-full bg-brickRed text-white py-2 rounded-xl font-semibold hover:bg-red-800 transition">Apply suggestion to form</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function ProjectCard({ project, isPast }) {
  const navigate = useNavigate();
  const getDomainColor = (domain) => {
    if (domain.includes("AI") || domain.includes("Machine")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (domain.includes("Web")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (domain.includes("Cyber")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  }
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-64 transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPast ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-brickRed'}`}>
            {project.status}
          </span>
          <span className="text-gray-400 text-sm">{new Date(project.createdAt).getFullYear()}</span>
        </div>
        <h4 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{project.title}</h4>
        <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">{project.students} Students</span>
        <span className="text-sm font-medium text-brickRed cursor-pointer hover:underline" onClick={() => navigate(`/manage-project/${project._id}`)}>Manage &rarr;</span>
      </div>
    </div>
  );
}
export default ProfessorDashboard;