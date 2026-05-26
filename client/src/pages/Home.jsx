import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaCreditCard,
  FaRobot,
  FaArrowRight,
  FaSearch,
  FaDatabase,
  FaNetworkWired,
} from "react-icons/fa";

function Home({ user }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hero-glow"
        ></motion.div>
        
        <div className="hero-content">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="hero-badge"
          >
            <FaShieldAlt className="badge-icon" /> Powered by Advanced Rule & NLP Engines
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Next-Generation <span className="highlight-text">Fraud Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hero-subtitle"
          >
            Vyom safeguards financial workspaces and messaging streams against advanced transaction scams, identity theft, and suspicious payment behaviors.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hero-actions"
          >
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                Enter Analyst Terminal <FaArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Deploy Security Hub
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Access Portal
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="features-section"
      >
        <div className="section-header">
          <h2>Core Defense Capabilities</h2>
          <p>Protecting endpoints, communications, and assets in real-time.</p>
        </div>

        <div className="features-grid">
          <motion.div variants={itemVariants} className="feature-card">
            <div className="feature-icon-wrapper">
              <FaCreditCard />
            </div>
            <h3>Transaction Analytics</h3>
            <p>
              Scans payments dynamically using custom scoring rules, checking amount velocity, geolocation threats, and device integrity.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="feature-card">
            <div className="feature-icon-wrapper">
              <FaRobot />
            </div>
            <h3>Scam Message NLP</h3>
            <p>
              Processes SMS and chats through pattern-matching classifiers to pinpoint urgency pressures, KYC phishing, and malware demands.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="feature-card">
            <div className="feature-icon-wrapper">
              <FaShieldAlt />
            </div>
            <h3>Real-Time Alerts</h3>
            <p>
              Triggers instant warnings via WebSockets to keep security operations connected with ongoing anomalous sessions.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Snapshots */}
      <section className="stats-strip">
        <div className="stat-item">
          <h2>99.8%</h2>
          <p>Uptime Safeguard</p>
        </div>
        <div className="stat-item">
          <h2>&lt; 50ms</h2>
          <p>Scoring Latency</p>
        </div>
        <div className="stat-item">
          <h2>Dual</h2>
          <p>Engine Blending (Node + Flask)</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} VYOM Secure Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;