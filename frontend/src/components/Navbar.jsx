import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isOrganizer } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
        ${location.pathname === to
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-[1000]">
      <Link to="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
        <span className="text-2xl">📍</span> LocalPulse
      </Link>

      <div className="flex items-center gap-1">
        {navLink('/', 'Map')}
        {navLink('/events', 'List')}

        {user ? (
          <>
            {isOrganizer && navLink('/dashboard', 'Dashboard')}
            {navLink('/profile', 'My Events')}
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
            <span className="ml-2 text-xs text-gray-500">
              Hi, <strong>{user.username}</strong>
            </span>
          </>
        ) : (
          <>
            {navLink('/login', 'Login')}
            <Link
              to="/register"
              className="ml-2 px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
