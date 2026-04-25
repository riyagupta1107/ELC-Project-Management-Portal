import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';

function ManageProject() {
  const { id } = useParams(); // This is the projectId
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FETCH PROJECT & APPLICATIONS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch both the project details AND the applications in parallel
        const [projectRes, appsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/projects/${id}`, { headers }),
          axios.get(`http://localhost:5000/api/applications/project/${id}`, { headers })
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchData();
    });

    return () => unsubscribe();
  }, [id]);

  // --- HANDLE ACCEPT / REJECT ---
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const token = await auth.currentUser.getIdToken();
      
      await axios.put(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      // Instantly update the UI without needing to refresh the page
      setApplications(prevApps => 
        prevApps.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      // If accepted, update the local project enrolled count to reflect the new addition
      if (newStatus === "Accepted") {
        setProject(prev => ({
          ...prev,
          enrolledStudents: [...(prev.enrolledStudents || []), "new_student"]
        }));
      }

    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update application status.");
    }
  };

  if (loading) return <div className="min-h-screen bg-offWhite flex justify-center items-center text-gray-500 font-medium animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="min-h-screen bg-offWhite flex justify-center items-center text-red-500">{error}</div>;
  if (!project) return null;

  // Split applications into Pending vs Processed for a cleaner UI
  const pendingApps = applications.filter(app => app.status === "Pending");
  const processedApps = applications.filter(app => app.status !== "Pending");

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation & Header */}
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
            <div className="bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 text-center min-w-[150px]">
              <p className="text-sm font-medium text-gray-500 mb-1">Capacity</p>
              <p className="text-2xl font-bold text-gray-800">
                <span className="text-brickRed">{project.enrolledStudents?.length || 0}</span> / {project.students}
              </p>
            </div>
          </div>
        </div>

        {/* PENDING APPLICATIONS SECTION */}
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
                    <button 
                      onClick={() => handleUpdateStatus(app._id, "Accepted")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm text-center shadow-sm"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(app._id, "Rejected")}
                      className="flex-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-2 px-4 rounded-lg transition-colors text-sm text-center border border-gray-200 hover:border-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROCESSED APPLICATIONS SECTION */}
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
    </div>
  );
}

export default ManageProject;