// import React from 'react'

// function Faculties() {
//   return (
//     <div>Faculties</div>
//   )
// }

// export default Faculties

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import logo from '../assets/thapar-logo.jpg'; // Adjust path if needed

function Faculties() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.get("http://localhost:5000/api/users/faculties", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        setFaculties(response.data);
      } catch (error) {
        console.error("Error fetching faculties:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchFaculties();
    });

    return () => unsubscribe();
  }, []);

  const filteredFaculties = faculties.filter(f => 
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-offWhite font-sans text-gray-800">
      
      {/* Basic Navbar (Match this to your other student pages) */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img className="h-20 w-auto" src={logo} alt="Logo" />
              <div>
                <h1 className="text-xl font-bold text-brickRed tracking-wide">ELC PORTAL</h1>
                <p className="text-xs text-gray-500 tracking-wider">FACULTY DIRECTORY</p>
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/student-dashboard" className="text-gray-500 hover:text-gray-700 font-medium">Dashboard</Link>
              <Link to="/projects" className="text-gray-500 hover:text-gray-700 font-medium">All Projects</Link>
              <Link to="/faculties" className="text-brickRed border-b-2 border-brickRed font-medium">Faculty</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Faculty Directory</h1>
            <p className="text-gray-500 mt-1">Browse professors offering research projects.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="w-full md:w-64 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-brickRed focus:border-brickRed"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading directory...</div>
        ) : filteredFaculties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
            No faculty members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculties.map(faculty => (
              <div key={faculty._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition">
                <div className="w-16 h-16 rounded-full bg-red-50 text-brickRed flex items-center justify-center text-2xl font-bold border border-red-100">
                  {faculty.firstName[0]}{faculty.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{faculty.firstName} {faculty.lastName}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    ✉️ {faculty.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Faculties;