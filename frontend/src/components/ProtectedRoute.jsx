import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const ProtectedRoute = ({ allowedRole }) => {
  const { currentUser, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold">Loading...</div>; 
  }

  // 1. Must be logged in
  if (!currentUser) {
    return <Navigate to="/" replace />; 
  }

  // 2. THE FIX: Only check the role if an 'allowedRole' was actually passed in
  if (allowedRole && userRole !== allowedRole) {
    const redirectPath = userRole === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Let them through
  return <Outlet />;
};

export default ProtectedRoute;