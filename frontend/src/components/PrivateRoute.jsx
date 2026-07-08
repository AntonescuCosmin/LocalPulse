import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, organizerOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (organizerOnly && user.role !== 'organizer') return <Navigate to="/" replace />;
  return children;
}
