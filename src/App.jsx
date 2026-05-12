import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './context/AuthContext'; 
import { LocationProvider } from './context/LocationContext';

import Header from './components/Header/Header'; 
import Footer from './components/Footer/Footer';
import HomeLoader from './components/Loaders/HomeLoader';

import ScrollToTop from './utils/ScrollToTop';
import { SuperAdminRoute, DashboardRoute, BusinessRoute, ProtectedRoute } from './utils/ProtectedRoutes';

import Home from './pages/Home/Home';
import BusinessHome from './pages/Home/BusinessHome';
import AuthPortal from './pages/Auth/Portal/Portal';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import OrganizationDashboard from './pages/Organization/Dashboard';
import Welcome from './pages/Welcome/Welcome';
import UserPanel from './pages/UserPanel/UserPanel';
import MisTurnos from './pages/MisTurnos/MisTurnos';
import PublicBooking from './pages/PublicBooking/PublicBooking';
import Onboarding from './pages/Onboarding/Onboarding';
import PaymentPage from './pages/Subscription/PaymentPage';

import NotFoundPage from './pages/NotFound/404';
import { isSuperAdminUser } from './utils/superAdmin';

function AppContent() {
  const { user, perfil, loading, isSuperAdmin, perfilLoading, isBusiness, isBusinessLoading } = useAuth();
  const isSuperAdminEffective = Boolean(
    isSuperAdmin || isSuperAdminUser({ user, profile: perfil })
  );
  
  if (loading || isBusinessLoading) {
    return <HomeLoader />;
  }

  const getRedirectPath = () => {
    if (isSuperAdminEffective) return '/admin';
    return isBusiness ? '/dashboard' : '/';
  };

  const renderPublicEntry = (fallbackElement) => {
    if (!user) return fallbackElement;
    if (perfilLoading) return <HomeLoader />;
    return <Navigate to={getRedirectPath()} replace />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <ScrollToTop />
      <Header /> 
      
      <main className="pt-24 min-h-screen bg-slate-100">
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={<Home />} 
            />
            
            <Route 
              path="/login" 
              element={renderPublicEntry(<AuthPortal />)} 
            />
            <Route 
              path="/registro" 
              element={renderPublicEntry(<AuthPortal />)} 
            />

            {/* RUTAS EXCLUSIVAS PARA DUEÑOS DE NEGOCIO */}
            <Route 
              path="/negocios" 
              element={<BusinessHome />} 
            />
            <Route 
              path="/negocios/login" 
              element={renderPublicEntry(<AuthPortal isBusinessMode={true} />)} 
            />
            <Route 
              path="/negocios/registro" 
              element={renderPublicEntry(<AuthPortal isBusinessMode={true} />)} 
            />
            <Route 
              path="/pago-suscripcion" 
              element={<PaymentPage />} 
            />

            <Route 
              path="/reserva/:slug" 
              element={<PublicBooking />} 
            />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<SuperAdminRoute />}>
              <Route path="/admin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<BusinessRoute />}>
              <Route path="/dashboard" element={perfilLoading ? <HomeLoader /> : isSuperAdminEffective ? <Navigate to="/admin" replace /> : <UserPanel />} />
              <Route path="/dashboard/:slug/*" element={perfilLoading ? <HomeLoader /> : isSuperAdminEffective ? <Navigate to="/admin" replace /> : <OrganizationDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute />}>
              <Route path="/mis-turnos" element={<MisTurnos />} />
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
    <AuthProvider>
      <LocationProvider>
        <Router>
            <AppContent />
            <Toaster 
              richColors 
              position="bottom-right" 
              closeButton={false}
              duration={3000}
            />
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
}
