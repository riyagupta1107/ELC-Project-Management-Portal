import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import TopNavbar from '../../components/TopNavbar';
import { useSocket } from '../../context/SocketContext';
import logo from '../../assets/thapar-logo.jpg';
import { FaBell } from 'react-icons/fa';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// --- CONSTANTS ---
const STATUS_COLORS = {
  Pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  Accepted: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  Ongoing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Completed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const DOMAIN_COLORS = (domain = '') => {
  if (domain.includes('AI') || domain.includes('Machine')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (domain.includes('Web')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (domain.includes('Cyber')) return 'bg-red-50 text-red-700 border-red-200';
  if (domain.includes('Data')) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (domain.includes('IoT') || domain.includes('Embedded')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold" style={{ color: accent || '#b5322a' }}>{value}</span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

function ApplicationCard({ application, handleWithdraw }) {
  const s = STATUS_COLORS[application.status] || STATUS_COLORS['Pending'];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-gray-800 truncate">{application.projectTitle}</h5>
        <p className="text-xs text-gray-500 mt-0.5">
          Prof. {application.professorName || 'Faculty'} &bull;{' '}
          {new Date(application.appliedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
        {application.status === "Pending" && (
          <button
            onClick={() => handleWithdraw(application._id)}
            className="mt-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1.5 px-4 rounded-lg text-xs border border-red-200 transition-colors"
          >
            Withdraw Application
          </button>
        )}
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text}`}>
        {application.status}
      </span>
    </div>
  );
}

function EnrolledCard({ project }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-60 transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">Enrolled</span>
          <span className="text-gray-400 text-sm">{new Date(project.createdAt).getFullYear()}</span>
        </div>
        <h4 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">{project.title}</h4>
        <p className="text-xs text-gray-500 mb-2 font-medium">Guided by Prof. {project.professorName || 'Faculty'}</p>
        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {project.domain?.slice(0, 2).map((d, i) => (
            <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium border ${DOMAIN_COLORS(d)}`}>{d}</span>
          ))}
        </div>
        <span
          onClick={() => navigate(`/project-details/${project._id}`)}
          className="text-sm font-medium text-brickRed cursor-pointer hover:underline"
        >
          View Details →
        </span>
      </div>
    </div>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
function StudentDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  const [allProjects, setAllProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [enrolledProjects, setEnrolled] = useState([]);

  const [activeTab, setActiveTab] = useState('applications');

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  const toggleNotificationDropdown = () => setIsNotificationDropdownOpen(!isNotificationDropdownOpen);

  // --- DATA FETCHING ---
  const fetchData = async (user) => {
    try {
      const token = await user.getIdToken();
      const headers = { "Authorization": `Bearer ${token}` };

      const [projectsRes, appsRes, notifRes] = await Promise.all([
        axios.get('http://localhost:5000/api/projects/all-projects', { headers }),
        axios.get('http://localhost:5000/api/applications/my-applications', { headers }),
        axiosInstance.get('/notifications')
      ]);

      setAllProjects(projectsRes.data.projects || []);
      setApplications(appsRes.data || []);
      setEnrolled(appsRes.data?.filter((a) => a.status === 'Accepted') || []);

      const data = notifRes.data;
      const notificationsArray = Array.isArray(data) ? data 
                              : Array.isArray(data?.notifications) ? data.notifications 
                              : Array.isArray(data?.data) ? data.data 
                              : []; 

      
      const unread = notificationsArray.filter(n => !n.isRead);
      setUnreadCount(unread.length); 
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Student';
        setName(firstName);
        fetchData(user);
      }
    });

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    return () => unsubscribe();
  }, []);

  // --- REAL-TIME NOTIFICATIONS ---
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };
      socket.on("newNotification", handleNewNotification);
      return () => socket.off("newNotification", handleNewNotification);
    }
  }, [socket]);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await axiosInstance.put(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      if (notif.link) navigate(notif.link);
      setIsNotificationDropdownOpen(false);
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.delete(`http://localhost:5000/api/applications/${applicationId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      toast.success("Application withdrawn.");
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application.");
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'Accepted').length;

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 relative">

      <TopNavbar subtitle="STUDENT DASHBOARD" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
          <h1 className="text-5xl font-bold text-brickRed mt-1">{name}.</h1>
          <p className="mt-2 text-gray-600">
            You have <span className="font-bold text-brickRed">{pendingCount} pending applications</span>
            {acceptedCount > 0 && <> and <span className="font-bold text-green-600">{acceptedCount} accepted</span></>}.
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Projects Available" value={allProjects.filter(p => p.status === 'Ongoing').length} />
          <StatCard label="Applications Sent" value={applications.length} />
          <StatCard label="Pending" value={pendingCount} accent="#d97706" />
          <StatCard label="Enrolled Projects" value={enrolledProjects.length} accent="#16a34a" />
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* TABS */}
        <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          {[{ key: 'applications', label: `My Applications (${applications.length})` },
          { key: 'enrolled', label: `Enrolled (${enrolledProjects.length})` }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab.key ? 'bg-white shadow text-brickRed' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'applications' && (
              <section className="flex flex-col gap-3 max-w-3xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">My Applications</h3>
                {applications.length === 0 ? <p className="text-gray-500 italic">No applications sent yet.</p> :
                  applications.map(app => <ApplicationCard key={app._id} application={app} handleWithdraw={handleWithdraw} />)}
              </section>
            )}

            {activeTab === 'enrolled' && (
              <section>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /> Enrolled Projects
                </h3>
                {enrolledProjects.length === 0 ? <p className="text-gray-500 italic">Not enrolled in any projects yet.</p> :
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledProjects.map(app => (
                      <EnrolledCard key={app._id} project={{ _id: app.projectId, title: app.projectTitle, description: app.projectDescription, domain: app.projectDomain, professorName: app.professorName, createdAt: app.appliedAt }} />
                    ))}
                  </div>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;