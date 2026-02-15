import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import logo from '../../assets/thapar-logo.jpg'; 

function ProfessorDashboard() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newProject, setNewProject] = useState({
    title: '', description: '', students: 0, status: 'Ongoing'  
  });
  
  // Filter projects
  const ongoingProjects = projects.filter(p => p.status === "Ongoing");
  const pastProjects = projects.filter(p => p.status === "Completed");

  // 1. User Name Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Professor';
        setName(firstName);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Greeting Effect
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    updateGreeting();
  }, []);

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <img className="h-20 w-auto" src={logo} alt="Thapar Logo" />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-brickRed tracking-wide">ELC PORTAL</h1>
                <p className="text-xs text-gray-500 tracking-wider">FACULTY DASHBOARD</p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-8">
              <NavLink to="/faculty-dashboard" active>Dashboard</NavLink>
              <NavLink to="/projects">All Projects</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </div>

            {/* Mobile Menu Button (Placeholder) */}
            <div className="md:hidden">
              <button className="text-gray-500 hover:text-brickRed">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
            <h1 className="text-5xl font-bold text-brickRed mt-1">{name}.</h1>
            <p className="mt-2 text-gray-600">You have <span className="font-bold text-brickRed">{ongoingProjects.length} active projects</span> under your supervision.</p>
          </div>
          
          {/* Add New Project Button */}
          <button className="bg-brickRed hover:bg-red-800 text-white px-6 py-3 rounded-lg shadow-lg transform transition hover:-translate-y-1 flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create New Project
          </button>
        </div>

        <hr className="border-gray-300 mb-10" />

        {/* 2. Ongoing Projects Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              Ongoing Projects
            </h3>
            <Link to="/projects" className="text-brickRed hover:underline text-sm font-semibold">View All &rarr;</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            

            {/* Project Cards */}
            {ongoingProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        {/* 3. Past Projects Section */}
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6 opacity-75">Past Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition duration-300">
            {pastProjects.map((project) => (
              <ProjectCard key={project.id} project={project} isPast={true} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

// 1. NavLink Component (Helper for menu items)
function NavLink({ to, children, active }) {
  return (
    <Link 
      to={to} 
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 h-full ${
        active 
        ? 'border-brickRed text-brickRed' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </Link>
  );
}

// 2. ProjectCard Component
function ProjectCard({ project, isPast }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-64 transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isPast ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-brickRed'
          }`}>
            {project.status}
          </span>
          <span className="text-gray-400 text-sm">{new Date().getFullYear()}</span>
        </div>
        <h4 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{project.title}</h4>
        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
          {project.description}
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex -space-x-2">
           {/* Fake Student Avatars */}
           {[...Array(project.students)].map((_,i) => (
             <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
               S{i+1}
             </div>
           ))}
        </div>
        <Link to={`/projects/${project.id}`} className="text-sm font-medium text-brickRed hover:text-red-800">
          Manage &rarr;
        </Link>
      </div>
    </div>
  );
}

export default ProfessorDashboard;