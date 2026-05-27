import { NavLink } from 'react-router-dom';
import { FaChartLine, FaShieldAlt, FaCommentDots } from 'react-icons/fa';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Analytics</div>
      
      <NavLink 
        to="/dashboard" 
        end
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <FaChartLine className="sidebar-icon" />
        Dashboard Overview
      </NavLink>

      <div className="sidebar-section-label" style={{ marginTop: 16 }}>AI Engines</div>
      
      <NavLink 
        to="/fraud-detection" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <FaShieldAlt className="sidebar-icon" />
        Transaction Fraud
      </NavLink>

      <NavLink 
        to="/scam-analyzer" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <FaCommentDots className="sidebar-icon" />
        Scam Message NLP
      </NavLink>
    </aside>
  );
}