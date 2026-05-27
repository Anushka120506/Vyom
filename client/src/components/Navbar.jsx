import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-dot"></div>
        VYOM
      </Link>

      <div className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        {user && (
          <Link to="/dashboard" className={location.pathname.startsWith('/dashboard') ? 'active' : ''}>
            Dashboard
          </Link>
        )}
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <div className="badge badge-neutral">
              <FaUserCircle /> {user.name}
            </div>
            <button onClick={handleLogout} className="btn-ghost" title="Logout">
              <FaSignOutAlt />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}