import React from 'react';
import Login from './Authentication/Login';
import Register from './Authentication/Register';
import Home from './pages/Home';
import StudentDashboard from './pages/Student/StudentDashboard'
import FacultyDashboard from './pages/Professor/ProfessorDashboard'
import ProfessorProjects from './pages/Professor/ProfessorProjects'
import ProfessorProfile from './pages/Professor/ProfessorProfile'
import Faculty from './pages/Faculties'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/student-dashboard' element={<StudentDashboard />} />
        <Route path='/faculty-dashboard' element={<FacultyDashboard />} />
        <Route path='/professor-projects' element={<ProfessorProjects />} />
        <Route path='/professor-profile' element={<ProfessorProfile />} />
        <Route path='/faculties' element={<Faculty />} />
      </Routes>
    </Router>
  )
}

export default App