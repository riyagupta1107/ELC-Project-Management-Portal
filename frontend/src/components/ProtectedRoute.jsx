import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRole }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute:", { user, loading, allowedRole });

  if (loading) {
    return <div>Loading...</div>;
  }

  // User not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role check
  if (
    allowedRole &&
    user.role.toUpperCase() !== allowedRole
  ) {
    return (
      <Navigate
        to={
          user.role.toUpperCase() === "FACULTY"
            ? "/faculty-dashboard"
            : "/student-dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;