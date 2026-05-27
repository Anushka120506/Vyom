import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="empty-icon">404</div>
      <h1 style={{ fontSize: 24, marginBottom: 12, color: 'var(--text-primary)' }}>Page Not Found</h1>
      <p style={{ marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Return Home</Link>
    </div>
  );
}