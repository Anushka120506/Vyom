import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">
        VYOM
      </h2>

      <nav className="sidebar-links">
        <NavLink to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/fraud-detection">
          Fraud Detection
        </NavLink>

        <NavLink to="/scam-analyzer">
          Scam Analyzer
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;