import React from 'react';
import Login from './Authentication/Login';
import Register from './Authentication/Register';
import Home from './pages/Home';
import StudentDashboard from './pages/Student/StudentDashboard'
import FacultyDashboard from './pages/Professor/ProfessorDashboard'
import ProfessorProfile from './pages/Professor/ProfessorProfile'
import Projects from "./pages/Projects";
import Faculty from './pages/Faculties'
import ProjectDetails from './pages/Student/ProjectDetails';
import ApplyModal from './pages/Student/ApplyModal';
import ProtectedRoute from './components/ProtectedRoute';
import ManageProject from './pages/Professor/ManageProject';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/home' element={<Home />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/professor-profile' element={<ProfessorProfile />} />
        <Route path='/faculties' element={<Faculty />} />
        <Route path='/project-details/:id' element={<ProjectDetails />} />
        <Route path='/apply-modal/:id' element={<ApplyModal />} />

        {/* FACULTY Only Routes */}
        <Route element={<ProtectedRoute allowedRole="FACULTY" />}>
          <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        </Route>
        <Route path='/manage-project/:id' element={< ManageProject />} />

        {/* STUDENT Only Routes */}
        <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App;