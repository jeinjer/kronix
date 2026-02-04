import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
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
import Onboarding from './pages/Onboarding/Onboarding';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-slate-50 dark:bg-[#050507] text-slate-900 dark:text-gray-200 font-sans flex flex-col transition-colors duration-500">
            
            <Header /> 
            
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

                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
            
            <Footer />

          </div>
        </Router>

        <Toaster 
           richColors 
           position="bottom-right" 
           closeButton
        />
      </AuthProvider>
    </ThemeProvider>
  );
}