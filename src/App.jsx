import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react'; // Importamos el ícono para el spinner

import { AuthProvider, useAuth } from './context/AuthContext'; // Importamos useAuth también
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header/Header'; 
import Footer from './components/Footer/Footer';
import ScrollToTop from './utils/ScrollToTop';
import { SuperAdminRoute, DashboardRoute } from './utils/ProtectedRoutes';

import Home from './pages/Home/Home';
import AuthPortal from './pages/Auth/Portal/Portal';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';
import NotFoundPage from './pages/NotFound/404';

import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import Dashboard from './pages/Dashboard/Dashboard';

import Welcome from './pages/Welcome/Welcome';
import Onboarding from './pages/Onboarding/Onboarding';


function AppContent() {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm animate-pulse font-medium">Iniciando KRONIX...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050507] text-slate-900 dark:text-gray-200 font-sans flex flex-col transition-colors duration-500">
      <ScrollToTop />
      <Header /> 
      
      <main className="pt-24 min-h-screen bg-slate-950">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPortal />} />
            <Route path="/registro" element={<AuthPortal />} />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<SuperAdminRoute />}>
              <Route path="/admin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<DashboardRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
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