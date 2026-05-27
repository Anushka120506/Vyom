import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import FraudDetection from './pages/FraudDetection';
import ScamAnalyzer from './pages/ScamAnalyzer';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

function PrivateOutlet() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }
  
  return user ? (
    <div className="app-shell with-sidebar">
      <Sidebar />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<PrivateOutlet />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fraud-detection" element={<FraudDetection />} />
          <Route path="/scam-analyzer" element={<ScamAnalyzer />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;