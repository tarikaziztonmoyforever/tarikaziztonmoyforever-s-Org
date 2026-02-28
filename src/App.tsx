import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import MessSetup from './pages/MessSetup';
import Dashboard from './pages/Dashboard';
import Meals from './pages/Meals';
import Bazar from './pages/Bazar';
import Finance from './pages/Finance';
import Profile from './pages/Profile';
import About from './pages/About';
import Admin from './pages/Admin';

function AppRoutes() {
  const { user, profile, mess, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/onboarding" element={user && !profile ? <Onboarding /> : <Navigate to="/" />} />
      <Route path="/setup" element={user && profile && !mess ? <MessSetup /> : <Navigate to="/" />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meals" element={<Meals />} />
        <Route path="/bazar" element={<Bazar />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
