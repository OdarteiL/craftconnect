import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Admin login is now handled by the regular login page.
// This component just redirects accordingly.
export default function AdminLoginPage() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}
