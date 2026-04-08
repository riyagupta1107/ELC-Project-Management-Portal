import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const ProtectedRoute = ({ allowedRole }) => {
  const { currentUser, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold">Loading...</div>; 
  }

  if (!currentUser) {
    return <Navigate to="/" replace />; 
  }

  if (userRole !== allowedRole) {
    const redirectPath = userRole === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;