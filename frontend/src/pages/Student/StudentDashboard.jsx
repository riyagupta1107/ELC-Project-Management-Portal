// import React from 'react'
// import StudentNavBar from './StudentNavBar'

// function StudentDashboard() {
//   return (
//     <div className='flex'>
//       <StudentNavBar />
//       <div></div>
//     </div>
//   )
// }

// export default StudentDashboard

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import logo from '../../assets/thapar-logo.jpg';

// --- CONSTANTS ---
const STATUS_COLORS = {
  Pending:  { bg: 'bg-yellow-50',  text: 'text-yellow-700', dot: 'bg-yellow-400' },
  Accepted: { bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500'  },
  Rejected: { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400'    },
  Ongoing:  { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500'   },
  Completed:{ bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

const DOMAIN_COLORS = (domain = '') => {
  if (domain.includes('AI') || domain.includes('Machine'))   return 'bg-purple-50 text-purple-700 border-purple-200';
  if (domain.includes('Web'))                                return 'bg-blue-50 text-blue-700 border-blue-200';
  if (domain.includes('Cyber'))                              return 'bg-red-50 text-red-700 border-red-200';
  if (domain.includes('Data'))                               return 'bg-teal-50 text-teal-700 border-teal-200';
  if (domain.includes('IoT') || domain.includes('Embedded')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition ${
        active
          ? 'border-brickRed text-brickRed'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold" style={{ color: accent || '#b5322a' }}>{value}</span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

function BrowseProjectCard({ project, onApply, alreadyApplied }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-72 transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-brickRed">
            {project.status}
          </span>
          <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
            {project.domain?.map((d, i) => (
              <span key={i} className={`px-2 py-1 rounded text-xs font-medium border ${DOMAIN_COLORS(d)}`}>{d}</span>
            ))}
          </div>
        </div>
        <h4 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">{project.title}</h4>
        <p className="text-gray-500 text-xs mb-1 font-medium">Prof. {project.professorName || 'Faculty'}</p>
        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">
          {project.students} seat{project.students !== 1 ? 's' : ''} available
        </span>
        {alreadyApplied ? (
          <span className="text-xs font-semibold text-gray-400 italic">Applied ✓</span>
        ) : (
          <button
            onClick={() => onApply(project)}
            className="text-sm font-semibold text-white bg-brickRed hover:bg-red-800 px-4 py-1.5 rounded-lg transition"
          >
            Apply →
          </button>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ application }) {
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
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text}`}>
        {application.status}
      </span>
    </div>
  );
}

function EnrolledCard({ project }) {
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
        <span className="text-sm font-medium text-brickRed cursor-pointer hover:underline">View Details →</span>
      </div>
    </div>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
function StudentDashboard() {
  const [name, setName]                 = useState('');
  const [greeting, setGreeting]         = useState('');
  const [loading, setLoading]           = useState(true);

  const [allProjects, setAllProjects]   = useState([]);
  const [applications, setApplications] = useState([]);
  const [enrolledProjects, setEnrolled] = useState([]);

  const [activeTab, setActiveTab]       = useState('browse');
  const [applyModal, setApplyModal]     = useState(null);
  const [applyNote, setApplyNote]       = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');

  // --- DATA FETCHING ---
  const fetchAllProjects = async () => {
    try {
      const res = await axios.get('http://localhost:5000/projects/all');
      setAllProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchApplications = async (user) => {
    try {
      const res = await axios.get('http://localhost:5000/applications/my-applications', {
        headers: { 'x-firebase-uid': user.uid },
      });
      setApplications(res.data);
      setEnrolled(res.data.filter((a) => a.status === 'Accepted'));
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  // --- AUTH & INITIAL LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Student';
        setName(firstName);
        Promise.all([fetchAllProjects(), fetchApplications(user)]).finally(() =>
          setLoading(false)
        );
      }
    });

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    return () => unsubscribe();
  }, []);

  // --- APPLY HANDLER ---
  const handleApply = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !applyModal) return;
    try {
      const res = await axios.post(
        'http://localhost:5000/applications/apply',
        { projectId: applyModal._id, note: applyNote },
        { headers: { 'x-firebase-uid': user.uid } }
      );
      setApplications((prev) => [res.data, ...prev]);
      setApplyModal(null);
      setApplyNote('');
      alert('Application submitted successfully!');
    } catch (err) {
      alert('Failed to submit application.');
    }
  };

  // --- DERIVED STATE ---
  const appliedProjectIds = new Set(applications.map((a) => a.projectId));
  const allDomains = ['All', ...new Set(allProjects.flatMap((p) => p.domain || []))];
  const filteredProjects = allProjects
    .filter((p) => p.status === 'Ongoing')
    .filter((p) => domainFilter === 'All' || p.domain?.includes(domainFilter))
    .filter((p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const pendingCount  = applications.filter((a) => a.status === 'Pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'Accepted').length;

  // =====================================================================
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
                <p className="text-xs text-gray-500 tracking-wider">STUDENT DASHBOARD</p>
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <NavLink to="/student-dashboard" active>Dashboard</NavLink>
              <NavLink to="/projects">All Projects</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/student-dashboard">Faculties</NavLink>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:p-0 p-4">
          <div>
            <h2 className="text-3xl font-light text-gray-500">{greeting},</h2>
            <h1 className="text-5xl font-bold text-brickRed mt-1">{name}.</h1>
            <p className="mt-2 text-gray-600">
              You have{' '}
              <span className="font-bold text-brickRed">
                {pendingCount} pending application{pendingCount !== 1 ? 's' : ''}
              </span>
              {acceptedCount > 0 && (
                <> and <span className="font-bold text-green-600">{acceptedCount} accepted</span></>
              )}.
            </p>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Projects Available" value={allProjects.filter(p => p.status === 'Ongoing').length} />
          <StatCard label="Applications Sent"  value={applications.length} />
          <StatCard label="Pending"            value={pendingCount}  accent="#d97706" />
          <StatCard label="Enrolled Projects"  value={enrolledProjects.length} accent="#16a34a" />
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* TABS */}
        <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'browse',       label: `Browse Projects` },
            { key: 'applications', label: `My Applications (${applications.length})` },
            { key: 'enrolled',     label: `Enrolled (${enrolledProjects.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white shadow text-brickRed'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your dashboard...</div>
        ) : (
          <>
            {/* ── BROWSE TAB ── */}
            {activeTab === 'browse' && (
              <section>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-brickRed"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm shadow-sm bg-white focus:outline-none focus:border-brickRed"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                  >
                    {allDomains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Showing <span className="font-semibold text-gray-800">{filteredProjects.length}</span> open project{filteredProjects.length !== 1 ? 's' : ''}
                </p>

                {filteredProjects.length === 0 ? (
                  <p className="text-gray-500 italic">No projects match your filters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <BrowseProjectCard
                        key={project._id}
                        project={project}
                        onApply={(p) => { setApplyModal(p); setApplyNote(''); }}
                        alreadyApplied={appliedProjectIds.has(project._id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── APPLICATIONS TAB ── */}
            {activeTab === 'applications' && (
              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h3>
                {applications.length === 0 ? (
                  <p className="text-gray-500 italic">You haven't applied to any projects yet.</p>
                ) : (
                  <div className="flex flex-col gap-3 max-w-3xl">
                    {applications.map((app) => (
                      <ApplicationCard key={app._id} application={app} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── ENROLLED TAB ── */}
            {activeTab === 'enrolled' && (
              <section>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  My Enrolled Projects
                </h3>
                {enrolledProjects.length === 0 ? (
                  <p className="text-gray-500 italic">
                    You're not enrolled in any projects yet. Apply and get accepted first!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledProjects.map((app) => (
                      <EnrolledCard
                        key={app._id}
                        project={{
                          _id: app.projectId,
                          title: app.projectTitle,
                          description: app.projectDescription,
                          domain: app.projectDomain,
                          professorName: app.professorName,
                          createdAt: app.appliedAt,
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* ── APPLY MODAL ── */}
      {applyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setApplyModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-1">Apply for Project</h2>
            <p className="text-sm text-gray-500 mb-4">{applyModal.title}</p>

            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium mb-1">About this project</p>
              <p className="text-sm text-gray-700 line-clamp-3">{applyModal.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {applyModal.domain?.map((d, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium border ${DOMAIN_COLORS(d)}`}>{d}</span>
                ))}
              </div>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows="4"
                  placeholder="Tell the professor why you're a great fit for this project..."
                  className="block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:border-brickRed focus:ring-brickRed focus:outline-none"
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brickRed text-white py-2 rounded-lg font-bold hover:bg-red-800 transition"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;