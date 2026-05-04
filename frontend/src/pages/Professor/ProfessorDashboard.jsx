import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import TopNavbar from '../../components/TopNavbar';


// --- CONSTANTS ---
const DOMAINS = [
  "Web Development",
  "App Development",
  "Machine Learning / AI",
  "Data Science",
  "Internet of Things (IoT)",
  "Cybersecurity",
  "Cloud Computing",
  "Blockchain",
  "Augmented / Virtual Reality",
  "Embedded Systems",
  "Robotics",
  "VLSI / Hardware Design",
  "Networking",
  "Game Development",
  "Other"
];

function ProfessorDashboard() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [projects, setProjects] = useState([]); // Store Real Projects
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal State
  const [loading, setLoading] = useState(true);

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
  // --- 1. FETCH PROJECTS FROM DB ---
  const fetchProjects = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const response = await axios.get("http://localhost:5000/api/projects/my-prof-projects", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      setProjects(response.data); 
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      // FIX: Tell the UI to stop loading!
      setLoading(false); 
    }
  };

  // --- 2. HANDLE AUTH & INITIAL LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Professor';
        setName(firstName);
        fetchProjects(user); // Fetch data when user is confirmed
      }
    });
    
    // Greeting Logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    return () => unsubscribe();
  }, []);

  // --- 3. HANDLE DOMAIN SELECTION ---
  const handleAddDomain = (e) => {
    const selectedDomain = e.target.value;
    if (selectedDomain && !newProject.domain.includes(selectedDomain)) {
      setNewProject({
        ...newProject,
        domain: [...newProject.domain, selectedDomain] // Add to array
      });
    }
    // Reset the dropdown back to default
    e.target.value = "";
  };

  const removeDomain = (domainToRemove) => {
    setNewProject({
      ...newProject,
      domain: newProject.domain.filter(d => d !== domainToRemove) // Remove from array
    });
  };

  const handleGenerateDraft = async () => {
    const rawInput = draftPrompt.trim() || newProject.description.trim();
    if (!rawInput) {
      setDraftError("Type some initial description text first, then click Reform with AI.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setDraftError("Please sign in again before using Magic Draft.");
      return;
    }

    setDrafting(true);
    setDraftError('');
    setDraftResult(null);

    try {
      const token = await user.getIdToken();
      const response = await axios.post("http://localhost:5000/api/projects/draft", { rawInput }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDraftResult(response.data);
      setDraftSuggestion(response.data.description || '');
      setDraftSuggestedDomains(response.data.domains || []);
      setShowDraftCard(true);
    } catch (error) {
      console.error("Draft error:", error);
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

  // --- 4. HANDLE FORM SUBMIT ---
  // --- 4. HANDLE FORM SUBMIT ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      // FIX 1: Get the secure token
      const token = await user.getIdToken();

      // FIX 2: Add /api and use the Bearer token header
      const response = await axios.post("http://localhost:5000/api/projects/add", newProject, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      const createdProject = response.data;
      setProjects([createdProject, ...projects]); 
      setIsModalOpen(false); 
      setNewProject({ title: '', domain:[], description: '', students: 0, status: 'Ongoing' }); 
      alert("Project Created Successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create project");
    }
  };

  // Filter projects for display
  const ongoingProjects = projects.filter(p => p.status === "Ongoing");
  const pastProjects = projects.filter(p => p.status === "Completed");

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 relative">
      
      <TopNavbar subtitle="FACULTY DASHBOARD" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 md:p-0 p-4">
          <div className=''>
            <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
            <h1 className="text-5xl font-bold text-brickRed mt-1">{name}.</h1>
            <p className="mt-2 text-gray-600">You have <span className="font-bold text-brickRed">{ongoingProjects.length} active projects</span>.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setShowDraftCard(false);
              setDraftResult(null);
              setDraftSuggestion('');
              setDraftSuggestedDomains([]);
              setDraftError('');
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
            {/* ONGOING PROJECTS */}
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

            {/* PAST PROJECTS */}
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

      {/* --- MODAL (POPUP FORM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Project</h2>
            
            <div className={showDraftCard ? "grid gap-6 xl:grid-cols-[1.7fr_1fr]" : "space-y-4"}>
              <form onSubmit={handleCreateProject} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Title</label>
                  <input 
                    type="text" 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domains (Select multiple)</label>
                  <select 
                    className="block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed bg-white"
                    onChange={handleAddDomain}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a Domain...</option>
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newProject.domain.map((d, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-brickRed border border-red-200">
                        {d}
                        <button 
                          type="button"
                          onClick={() => removeDomain(d)}
                          className="ml-1 text-red-500 hover:text-red-700 focus:outline-none font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPrompt(newProject.description || '');
                        setDraftError('');
                        setShowDraftCard(true);
                      }}
                      className="text-sm text-brickRed font-semibold hover:underline"
                    >
                      Reform with AI
                    </button>
                  </div>
                  <textarea 
                    required
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-brickRed focus:ring-brickRed"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Students Needed</label>
                    <input 
                      type="number" 
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={newProject.students}
                      onChange={(e) => setNewProject({...newProject, students: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brickRed text-white py-2 rounded-lg font-bold hover:bg-red-800 transition"
                >
                  Save Project
                </button>
              </form>

              {showDraftCard && (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                  {draftResult && (
                    <div className="flex justify-end mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftPrompt(newProject.description || '');
                          setDraftResult(null);
                          setDraftSuggestion('');
                          setDraftSuggestedDomains([]);
                          setDraftError('');
                        }}
                        className="text-sm font-semibold text-brickRed hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {draftError && <p className="mt-2 text-sm text-red-600">{draftError}</p>}
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={drafting}
                    className="mt-1 w-full bg-brickRed text-white py-2 rounded-xl font-semibold hover:bg-red-800 transition disabled:opacity-60"
                  >
                    {drafting ? 'Generating suggestion...' : 'Refine description with AI'}
                  </button>

                  {draftResult && (
                    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Suggested Description</h4>
                        <textarea
                          rows="5"
                          value={draftSuggestion}
                          onChange={(e) => setDraftSuggestion(e.target.value)}
                          className="mt-3 block w-full rounded-xl border-gray-300 shadow-sm border p-3 focus:border-brickRed focus:ring-brickRed"
                        />
                      </div>
                      {draftSuggestedDomains.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Suggested Domains</p>
                          <div className="flex flex-wrap gap-2">
                            {draftSuggestedDomains.map((domain, index) => (
                              <span key={index} className="px-2 py-1 rounded-full bg-red-50 text-brickRed border border-red-200 text-xs">
                                {domain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAcceptDraft}
                        className="w-full bg-brickRed text-white py-2 rounded-xl font-semibold hover:bg-red-800 transition"
                      >
                        Apply suggestion to form
                      </button>
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
          <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
             {project.domain && project.domain.map((d, index) => (
                <span key={index} className={`px-2 py-1 rounded text-xs font-medium border ${getDomainColor(d)}`}>
                  {d}
                </span>
             ))}
          </div>
        </div>
        <h4 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{project.title}</h4>
        <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">{project.students} Students</span>
        
        {/* Update this span to trigger navigation */}
        <span 
          className="text-sm font-medium text-brickRed cursor-pointer hover:underline"
          onClick={() => navigate(`/manage-project/${project._id}`)}
        >
          Manage &rarr;
        </span>
        
      </div>
    </div>
  );
}

export default ProfessorDashboard;