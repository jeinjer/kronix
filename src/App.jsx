import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './context/AuthContext'; 
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header/Header'; 
import Footer from './components/Footer/Footer';
import HomeLoader from './components/Loaders/HomeLoader';

import ScrollToTop from './utils/ScrollToTop';
import { SuperAdminRoute, DashboardRoute } from './utils/ProtectedRoutes';

import Home from './pages/Home/Home';
import AuthPortal from './pages/Auth/Portal/Portal';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import OrganizationDashboard from './pages/Organization/Dashboard';
import Welcome from './pages/Welcome/Welcome';
import UserPanel from './pages/UserPanel/UserPanel';
import Onboarding from './pages/Onboarding/Onboarding';
import SubscriptionPlansPage from './pages/Suscripciones/Suscripciones';

import NotFoundPage from './pages/NotFound/404';
import { isSuperAdminUser } from './utils/superAdmin';

function AppContent() {
  const { user, perfil, loading, isSuperAdmin, perfilLoading } = useAuth();
  const isSuperAdminEffective = Boolean(
    isSuperAdmin || isSuperAdminUser({ user, profile: perfil })
  );
  
  if (loading) {
    return <HomeLoader />;
  }

  const getRedirectPath = () => isSuperAdminEffective ? "/admin" : "/dashboard";

  const renderPublicEntry = (fallbackElement) => {
    if (!user) return fallbackElement;
    if (perfilLoading) return <HomeLoader />;
    return <Navigate to={getRedirectPath()} replace />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050507] text-slate-900 dark:text-gray-200 font-sans flex flex-col transition-colors duration-500">
      <ScrollToTop />
      <Header /> 
      
      <main className="pt-24 min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-500">
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={renderPublicEntry(<Home />)} 
            />
            
            <Route 
              path="/login" 
              element={renderPublicEntry(<AuthPortal />)} 
            />
            <Route 
              path="/registro" 
              element={renderPublicEntry(<AuthPortal />)} 
            />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<SuperAdminRoute />}>
              <Route path="/admin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<DashboardRoute />}>
              <Route path="/dashboard" element={perfilLoading ? <HomeLoader /> : isSuperAdminEffective ? <Navigate to="/admin" replace /> : <UserPanel />} />
              <Route path="/dashboard/:slug" element={perfilLoading ? <HomeLoader /> : isSuperAdminEffective ? <Navigate to="/admin" replace /> : <OrganizationDashboard />} />
            </Route>

            <Route path="/welcome" element={<Welcome />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/suscripciones" element={<SubscriptionPlansPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
           <AppContent />
           <Toaster 
             richColors 
             position="bottom-right" 
             closeButton={false}
             duration={3000}
           />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
