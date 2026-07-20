import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [resumeLink, setResumeLink] = useState('');
  const [applicationMessage, setApplicationMessage] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setResumeLink('');
    setApplicationMessage('');
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosInstance.post('/applications/apply', {
        projectId: id,
        message: applicationMessage.trim(),
        resumeLink: resumeLink
      });

      toast.success("Application submitted successfully!");
      setAlreadyApplied(true);
      toggleModal();
    } catch (err) {
      console.error("Error submitting application", err);
      toast.error("Failed to submit application. You may have already applied.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchProjectDetailsAndApps = async () => {
      try {
        const [projectRes, appsRes] = await Promise.all([
          axiosInstance.get(`/projects/${id}`),
          axiosInstance.get('/applications/my-applications')
        ]);
        
        setProject(projectRes.data);
        const hasApplied = appsRes.data.some((app) => String(app.project?._id || app.projectId?._id || app.projectId) === id);
        setAlreadyApplied(hasApplied);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("Could not load project details.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProjectDetailsAndApps();
    } else {
      setLoading(false);
      setError("You must be logged in to view this.");
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-offWhite flex justify-center items-center">
        <div className="text-xl text-gray-500 font-medium animate-pulse">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-offWhite flex flex-col justify-center items-center">
        <p className="text-red-500 text-lg mb-4">{error || "Project not found."}</p>
        <button onClick={() => navigate('/projects')} className="text-brickRed hover:underline font-medium">
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "Unknown Date";

  return (
    <>
      <div className="min-h-screen bg-offWhite font-sans text-gray-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-brickRed transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to list
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${project.status === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                  {project.status || "Ongoing"}
                </span>
                <span className="text-sm text-gray-400 font-medium">Posted on {createdDate}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{project.title}</h1>
              <div className="flex flex-wrap gap-2 mt-4">
                {project.domain && project.domain.map((d, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded text-sm font-medium">{d}</span>
                ))}
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Project Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project Lead</h4>
                  <p className="text-lg font-semibold text-gray-800">{project.professorName || "Faculty Member"}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Team Size</h4>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-bold text-gray-800">{project.enrolledStudents?.length || 0}</span>
                    <span className="text-gray-500 font-medium mb-1">/ {project.students || 1} Enrolled</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-brickRed h-2 rounded-full" style={{ width: `${Math.min(((project.enrolledStudents?.length || 0) / (project.students || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>

                {user?.role === "STUDENT" && project.status !== "Completed" && (
                  <div className="pt-4">
                    {alreadyApplied ? (
                      <div className="text-center py-3">
                        <span className="text-xs font-semibold text-gray-400 italic">Already Applied</span>
                      </div>
                    ) : (
                      <>
                        <button onClick={toggleModal} className="w-full bg-brickRed hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm">
                          Apply for Project
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2">Subject to faculty approval</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- APPLICATION MODAL --- */}
      {isModalOpen && !alreadyApplied && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Apply for Project</h3>
              <button onClick={toggleModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={submitApplication} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Why are you interested? <span className="text-red-500">*</span></label>
                <textarea required value={applicationMessage} onChange={(e) => setApplicationMessage(e.target.value)} rows="4"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-brickRed focus:border-brickRed outline-none"
                  placeholder="Briefly introduce your relevant skills and interest." />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume / Portfolio Link <span className="text-red-500">*</span></label>
                <input
                  type="url" required value={resumeLink} onChange={(e) => setResumeLink(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-brickRed focus:border-brickRed outline-none"
                  placeholder="e.g., https://drive.google.com/... or your Github"
                />
                <p className="text-xs text-gray-500 mt-2">Please provide a valid URL to your resume or portfolio so the professor can review your skills.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={toggleModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none shadow-sm transition-colors ${submitting ? 'bg-red-400 cursor-not-allowed' : 'bg-brickRed hover:bg-red-800'}`}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectDetails;
