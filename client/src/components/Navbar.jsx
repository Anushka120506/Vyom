import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaSignOutAlt, FaUserShield } from "react-icons/fa";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" className="logo-link">
          <FaShieldAlt className="logo-icon" />
          <span>VYOM</span>
        </Link>
      </div>

      <div className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>

        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/fraud-detection">Fraud Simulator</NavLink>
            <NavLink to="/scam-analyzer">NLP Message Scan</NavLink>
            <div className="nav-user-profile">
              <FaUserShield className="profile-icon" />
              <span className="profile-name">{user.name.split(" ")[0]}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="nav-logout-btn"
                title="Deauthorize session"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn-secondary">
              Secure Access
            </Link>
            <Link to="/register" className="nav-btn-primary">
              Deploy Hub
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;