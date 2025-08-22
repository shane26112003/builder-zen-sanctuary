import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Train } from 'lucide-react';

export default function Index() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.userType === 'general') {
      navigate('/user-type');
    } else {
      navigate('/booking');
    }
  }, [isAuthenticated, user, navigate]);

  // Loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 animate-pulse">
          <Train className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">MetroReserve</h1>
        <p className="mt-2 text-gray-600">Loading your metro seat reservation system...</p>
      </div>
    </div>
  );
}
