import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import logo from '../assets/thapar-logo.jpg';

// --- CONSTANTS ---
const DOMAINS = [
  "All Domains", "Web Development", "App Development", "Machine Learning / AI",
  "Data Science", "Internet of Things (IoT)", "Cybersecurity", "Cloud Computing",
  "Blockchain", "Augmented / Virtual Reality", "Embedded Systems", "Robotics",
  "VLSI / Hardware Design", "Networking", "Game Development", "Other"
];

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset to page 1 if the user changes the search term or domain filter
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDomain]);

  // --- FETCH PROJECTS ---
  useEffect(() => {
    let isMounted = true;

    const fetchAllProjects = async (user) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        
        // Pass our filters and page to the backend via 'params'
        const response = await axios.get("http://localhost:5000/api/projects/all-projects", {
          headers: { "Authorization": `Bearer ${token}` },
          params: {
            page: page,
            limit: 9, // Number of items per page
            search: searchTerm,
            domain: selectedDomain
          }
        });

        // Backend now returns an object with the data array inside
        if (isMounted) {
          setProjects(response.data.projects);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // DEBOUNCE: Wait 400ms after the user stops typing to trigger the API call
    const delayDebounceFn = setTimeout(() => {
      auth.onAuthStateChanged((user) => {
        if (user) fetchAllProjects(user);
        else setLoading(false);
      });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [page, searchTerm, selectedDomain]);


  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 relative">
        {/* NAVBAR */}
        <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <img className="h-20 w-auto" src={logo} alt="Thapar Logo" />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-brickRed tracking-wide">ELC PORTAL</h1>
                            <p className="text-xs text-gray-500 tracking-wider">PROJECT DIRECTORY</p>
                        </div>
                    </div>
                    <div className="hidden md:flex space-x-8">
                        <NavLink to="/student-dashboard">Dashboard</NavLink>
                        <NavLink to="/projects" active>All Projects</NavLink>
                        <NavLink to="/profile">Profile</NavLink>
                    </div>
                </div>
            </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            
            {/* HEADER & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Explore Projects</h1>
                    <p className="text-gray-500 mt-1">Discover ongoing research and development.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <select 
                        className="border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-brickRed focus:border-brickRed"
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                        {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-brickRed focus:border-brickRed" 
                            placeholder="Search projects or faculty..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* PROJECTS GRID */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
                    <button onClick={() => {setSearchTerm(''); setSelectedDomain('All Domains')}} className="mt-4 text-brickRed hover:underline font-medium">Clear Filters</button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                          <ProjectCard key={project._id} project={project} />
                        ))}
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-6 mt-12">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-5 py-2.5 rounded-lg font-bold transition-colors ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-brickRed border border-brickRed hover:bg-red-50 shadow-sm'}`}
                            >
                                &larr; Previous
                            </button>
                            
                            <span className="text-gray-600 font-medium">
                                Page <span className="font-bold text-gray-900">{page}</span> of {totalPages}
                            </span>

                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`px-5 py-2.5 rounded-lg font-bold transition-colors ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-brickRed border border-brickRed hover:bg-red-50 shadow-sm'}`}
                            >
                                Next &rarr;
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    </div>
  )
}

// --- SUB COMPONENTS ---
function NavLink({ to, children, active }) {
    return (
      <Link to={to} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${active ? 'border-brickRed text-brickRed' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        {children}
      </Link>
    );
}

function ProjectCard({ project }) {
  // 1. Initialize the navigation hook
  const navigate = useNavigate(); 

  const getDomainColor = (domain) => {
    if (!domain) return "bg-gray-50 text-gray-700 border-gray-200";
    if (domain.includes("AI") || domain.includes("Machine")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (domain.includes("Web")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (domain.includes("Cyber")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  const isCompleted = project.status === "Completed";

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-64 transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
            {project.status}
          </span>
          
          <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
             {project.domain && project.domain.slice(0, 2).map((d, index) => (
                <span key={index} className={`px-2 py-1 rounded text-xs font-medium border ${getDomainColor(d)}`}>
                  {d}
                </span>
             ))}
             {project.domain && project.domain.length > 2 && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">+{project.domain.length - 2}</span>
             )}
          </div>
        </div>
        
        <h4 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{project.title}</h4>
        <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Project Lead</span>
            <span className="text-sm font-semibold text-gray-700">
              {project.professorName || "Unknown Faculty"}
            </span>
         </div>
         
        {/* 2. Add the onClick handler to route to the details page */}
        <span 
          onClick={() => navigate(`/project-details/${project._id}`)} 
          className="text-sm font-medium text-brickRed cursor-pointer hover:underline self-end mb-1"
        >
          View Details &rarr;
        </span>

      </div>
    </div>
  );
}

export default Projects;