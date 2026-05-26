import { NavLink } from "react-router-dom";
import { FaChartBar, FaCreditCard, FaEnvelopeOpenText } from "react-icons/fa";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header-box">
        <h3>CONTROLS</h3>
      </div>

      <nav className="sidebar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaChartBar className="sidebar-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/fraud-detection"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaCreditCard className="sidebar-icon" />
          <span>Fraud Simulator</span>
        </NavLink>

        <NavLink
          to="/scam-analyzer"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaEnvelopeOpenText className="sidebar-icon" />
          <span>NLP message Scan</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;