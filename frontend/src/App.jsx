import React from 'react';
import Login from './Authentication/Login';
import Register from './Authentication/Register';
import Home from './pages/Home';
import StudentDashboard from './pages/Student/StudentDashboard'
import FacultyDashboard from './pages/Professor/ProfessorDashboard'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/home' element={<Home />} />
        <Route path='/student-dashboard' element={<StudentDashboard />} />
        <Route path='/faculty-dashboard' element={<FacultyDashboard />} />
      </Routes>
    </Router>
  )
}

export default App