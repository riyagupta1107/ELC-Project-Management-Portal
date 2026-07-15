import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/thapar-logo.jpg';

export default function TopNavbar({ subtitle }) {
  const { user, logout } = useAuth();
  const dashboardPath = user?.role === 'FACULTY' ? '/faculty-dashboard' : '/student-dashboard';

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-4 py-3 border-b-2 text-sm font-medium h-full transition ${
      isActive ? 'border-brickRed text-brickRed' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center gap-3">
            <img className="h-20 w-auto" src={logo} alt="Thapar Logo" />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-brickRed tracking-wide">ELC PORTAL</h1>
              <p className="text-xs text-gray-500 tracking-wider">{subtitle}</p>
            </div>
          </div>

          <div className="hidden md:flex space-x-8">
            <NavLink end to={dashboardPath} className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink end to="/projects" className={navLinkClass}>
              All Projects
            </NavLink>
            <NavLink end to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
            <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-brickRed">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
