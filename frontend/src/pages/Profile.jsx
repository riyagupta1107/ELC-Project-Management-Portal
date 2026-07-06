import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext'; // NEW: Imported AuthContext
import logo from '../assets/thapar-logo.jpg';

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth(); // NEW: Hook into JWT auth context
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    resumeLink: '',
    role: '', 
    email: '' 
  });

  // --- FETCH CURRENT PROFILE DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/api/users/profile");
        const userData = response.data;
        
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          resumeLink: userData.resumeLink || '',
          role: userData.role || '',
          email: userData.email || '' 
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage({ text: "Failed to load profile data.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SAVE UPDATED PROFILE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await axiosInstance.put("/api/users/profile", formData);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ text: "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500 font-medium animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img className="h-16 w-auto object-contain" src={logo} alt="Logo" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-wide">ELC PORTAL</h1>
                <p className="text-xs text-gray-500 tracking-wider">ACCOUNT SETTINGS</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-brickRed font-medium flex items-center gap-2 transition bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-lg">
              &larr; Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* HTML Layout is entirely identical from your previous version */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-28">
              <div className="h-32 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 relative"></div>
              <div className="px-6 pb-8 relative text-center">
                <div className="w-28 h-28 mx-auto -mt-14 bg-brickRed text-white flex items-center justify-center text-4xl font-bold rounded-full border-4 border-white shadow-md">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
                <p className="text-sm text-gray-500 mt-1">{formData.email}</p>
                <span className="inline-block mt-4 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold tracking-widest uppercase border border-gray-200">
                  {formData.role} ACCOUNT
                </span>
                {formData.bio && (
                  <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600 text-left italic">
                    "{formData.bio}"
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              </div>
              {message.text && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                    <input type="text" name="firstName" required className="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm border p-3" value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                    <input type="text" name="lastName" required className="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm border p-3" value={formData.lastName} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" name="phone" className="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm border p-3" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resume / Portfolio URL</label>
                  <input type="url" name="resumeLink" className="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm border p-3" value={formData.resumeLink} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Professional Bio</label>
                  <textarea name="bio" rows="5" className="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm border p-3" value={formData.bio} onChange={handleChange} />
                </div>
                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 text-gray-600 font-medium mr-4">Cancel</button>
                  <button type="submit" disabled={saving} className="px-8 py-2.5 bg-brickRed text-white font-bold rounded-lg hover:bg-red-800">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default Profile;