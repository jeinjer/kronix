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

import NotFoundPage from './pages/NotFound/404';

function AppContent() {
  const { user, loading, isSuperAdmin } = useAuth();
  
  if (loading) {
    return <HomeLoader />;
  }

  const getRedirectPath = () => isSuperAdmin ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050507] text-slate-900 dark:text-gray-200 font-sans flex flex-col transition-colors duration-500">
      <ScrollToTop />
      <Header /> 
      
      <main className="pt-24 min-h-screen bg-slate-950">
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to={getRedirectPath()} replace /> : <Home />} 
            />
            
            <Route 
              path="/login" 
              element={user ? <Navigate to={getRedirectPath()} replace /> : <AuthPortal />} 
            />
            <Route 
              path="/registro" 
              element={user ? <Navigate to={getRedirectPath()} replace /> : <AuthPortal />} 
            />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<SuperAdminRoute />}>
              <Route path="/admin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<DashboardRoute />}>
              <Route path="/dashboard" element={isSuperAdmin ? <Navigate to="/admin" replace /> : <UserPanel />} />
              <Route path="/dashboard/:slug" element={isSuperAdmin ? <Navigate to="/admin" replace /> : <OrganizationDashboard />} />
            </Route>

            <Route path="/welcome" element={<Welcome />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
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
             closeButton
           />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}