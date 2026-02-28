import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';
import { Loader2 } from 'lucide-react';

export default function Layout() {
  const { user, profile, mess, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;
  if (!profile) return <Navigate to="/onboarding" />;
  if (!mess) return <Navigate to="/setup" />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 pb-24 px-4 md:px-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
