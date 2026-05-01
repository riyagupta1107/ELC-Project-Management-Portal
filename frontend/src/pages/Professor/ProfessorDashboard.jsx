import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import logo from '../../assets/thapar-logo.jpg';
import { FaBell } from 'react-icons/fa'; 
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

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
  const navigate = useNavigate();
  // Call useSocket inside the component!
  const socket = useSocket();

  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [projects, setProjects] = useState([]); // Store Real Projects
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal State
  const [loading, setLoading] = useState(true);
  
  // Notice & Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [noticeData, setNoticeData] = useState({ title: '', message: '' });

  // Form State for New Project
  const [newProject, setNewProject] = useState({
    title: '', domain: [], description: '', students: 0, status: 'Ongoing'
  });

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  };

  // --- 1. FETCH PROJECTS FROM DB ---
  const fetchProjects = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.get("http://localhost:5000/api/projects/my-prof-projects", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      setProjects(response.data); 
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false); 
    }
  };

  // --- 2. HANDLE NOTIFICATIONS ---
  const handleNotificationClick = async (notif) => {
    try {
        if (!notif.isRead) {
            await axiosInstance.put(`/notifications/${notif._id}/read`);
            setNotifications(prev => 
                prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        if (notif.link) {
            navigate(notif.link);
        }
        
        setIsNotificationDropdownOpen(false); 
    } catch (err) {
        console.error("Error marking notification as read", err);
    }
  };

  useEffect(() => {
    // Fetch Historical Notifications
    const fetchNotifications = async () => {
        try {
            const res = await axiosInstance.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const user = auth.currentUser;
    if (user) fetchNotifications();

    // Listen for Live Updates
    if (socket) {
        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };
        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newNotification", handleNewNotification);
        };
      }
  }, [socket]); 

  // --- 3. HANDLE AUTH & INITIAL LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Professor';
        setName(firstName);
        fetchProjects(user); 
      } else {
        setLoading(false);
      }
    });
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    return () => unsubscribe();
  }, []);

  // --- 4. HANDLE DOMAIN SELECTION ---
  const handleAddDomain = (e) => {
    const selectedDomain = e.target.value;
    if (selectedDomain && !newProject.domain.includes(selectedDomain)) {
      setNewProject({
        ...newProject,
        domain: [...newProject.domain, selectedDomain] 
      });
    }
    e.target.value = "";
  };

  const removeDomain = (domainToRemove) => {
    setNewProject({
      ...newProject,
      domain: newProject.domain.filter(d => d !== domainToRemove) 
    });
  };

  // --- 5. HANDLE FORM SUBMITS ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await axios.post("http://localhost:5000/api/projects/add", newProject, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      setProjects([response.data, ...projects]); 
      setIsModalOpen(false); 
      setNewProject({ title: '', domain:[], description: '', students: 0, status: 'Ongoing' }); 
      toast.success("Project Created Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project");
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
        const dataToSend = {
            title: noticeData.title,
            content: noticeData.message 
        };
        
        await axiosInstance.post('/notices/add', dataToSend);
        
        toast.success("Notice posted successfully!");
        setIsNoticeModalOpen(false); 
        setNoticeData({ title: '', message: '' }); 
    } catch (error) {
        console.error("Failed to post notice:", error);
        toast.error("Failed to post notice.");
    }
};

  // Filter projects for display
  const ongoingProjects = projects.filter(p => p.status === "Ongoing");
  const pastProjects = projects.filter(p => p.status === "Completed");

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
                <p className="text-xs text-gray-500 tracking-wider">FACULTY DASHBOARD</p>
              </div>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <NavLink to="/faculty-dashboard" active>Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>

              {/* Bell Icon for Notifications */}
              <div className="relative">
                <button
                  className="relative text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={toggleNotificationDropdown}
                >
                  <FaBell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 h-2.5 w-2.5 rounded-full border-2 border-white"></span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700">Notifications</h4>
                    <span className="text-xs text-brickRed font-semibold">{unreadCount} New</span>
                  </div>
                  
                  <ul className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-6 text-sm text-gray-500 text-center italic">
                        No notifications yet.
                      </li>
                    ) : (
                      notifications.map(notif => (
                        <li 
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 text-sm cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-gray-50 text-gray-600' : 'bg-red-50 hover:bg-red-100 text-gray-900'}`}
                        >
                          <div className={`mb-1 ${notif.isRead ? 'font-semibold text-gray-700' : 'font-bold text-brickRed'}`}>
                            {notif.title}
                          </div>
                          <div className="text-gray-600 line-clamp-2">
                            {notif.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 md:p-0 p-4">
          <div className=''>
            <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
            <h1 className="text-5xl font-bold text-brickRed mt-1">{name}.</h1>
            <p className="mt-2 text-gray-600">You have <span className="font-bold text-brickRed">{ongoingProjects.length} active projects</span>.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsNoticeModalOpen(true)}
              className="bg-white border-2 border-brickRed text-brickRed w-max hover:bg-red-50 px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 font-semibold transition"
            >
              Post Notice
            </button>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-brickRed w-max hover:bg-red-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-semibold transition"
            >
              + Create Project
            </button>
          </div>
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

      {/* --- CREATE PROJECT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Project</h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">

              {/* TITLE */}
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

              {/* --- MULTI-SELECT DOMAIN SECTION --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domains (Select multiple)</label>
                
                {/* The Dropdown */}
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

                {/* The Selected Tags Display */}
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

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
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
          </div>
        </div>
      )}

      {/* --- POST NOTICE MODAL --- */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsNoticeModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Post a Notice</h2>
            <p className="text-sm text-gray-500 mb-6">Broadcast an announcement to your students.</p>
            
            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notice Title</label>
                <input 
                  type="text" 
                  required 
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-brickRed focus:ring-brickRed outline-none"
                  value={noticeData.title}
                  onChange={(e) => setNoticeData({...noticeData, title: e.target.value})}
                  placeholder="e.g., Lab Meeting Rescheduled"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea 
                  required 
                  rows="4" 
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-brickRed focus:ring-brickRed outline-none"
                  value={noticeData.message}
                  onChange={(e) => setNoticeData({...noticeData, message: e.target.value})}
                  placeholder="Type your announcement here..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full bg-brickRed text-white py-2 rounded-lg font-bold hover:bg-red-800 transition shadow-sm"
                >
                  Send Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB COMPONENTS ---

function NavLink({ to, children, active }) {
  return (
    <Link to={to} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${active ? 'border-brickRed text-brickRed' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {children}
    </Link>
  );
}

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