import { Link } from 'react-router-dom';
import { FaShieldAlt, FaRobot, FaBolt, FaLock } from 'react-icons/fa';

export default function Home() {
  return (
    <div>
      <section className="home-hero">
        <div className="hero-badge">
          <div className="live-dot"></div>
          AI Engine Online
        </div>
        <h1 className="hero-title">
          Next-Gen <span className="gradient-text">Fraud Prevention</span>
        </h1>
        <p className="hero-sub">
          Vyom uses real-time AI and natural language processing to detect 
          transaction fraud and scam attempts before they happen.
        </p>
        
        <div className="hero-actions">
          <Link to="/register" className="btn-hero btn-hero-primary">
            Start Protecting
          </Link>
          <a href="#features" className="btn-hero btn-hero-secondary">
            Learn More
          </a>
        </div>
        
        <div className="home-features" id="features">
          <div className="feature-card">
            <div className="feature-icon"><FaRobot /></div>
            <h3>AI Fraud Scoring</h3>
            <p>Our machine learning models analyze location, device, and behavioral signals instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaShieldAlt /></div>
            <h3>NLP Scam Detection</h3>
            <p>Analyze text messages and emails for phishing, urgency manipulation, and impersonation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaBolt /></div>
            <h3>Real-time Alerts</h3>
            <p>Websocket integration pushes critical alerts to your dashboard the millisecond they occur.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FaLock /></div>
            <h3>Secure Infrastructure</h3>
            <p>Built with enterprise-grade JWT auth, rate limiting, and structured observability.</p>
          </div>
        </div>
      </section>
    </div>
  );
}