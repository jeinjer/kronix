import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutGrid, Menu, X, Sparkles, ChevronRight, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { session, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  
  // Estados para menús
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Referencia para detectar clic afuera

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Cerrar dropdown si se hace clic afuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hideNavRoutes = ['/login', '/registro', '/forgot-password', '/reset-password'];
  const isAuthPage = hideNavRoutes.includes(location.pathname);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-white/10 py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center w-10 h-10 group-hover:scale-110 transition-transform duration-300">
             <img 
               src="/kronix.png" 
               alt="Kronix Logo" 
               className="w-10 h-10 object-contain invert"
             />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white leading-none group-hover:text-indigo-200 transition-colors">
              KRONIX
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase leading-none mt-1 group-hover:text-cyan-400 transition-colors">
              By Tommasys
            </span>
          </div>
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <div className="hidden md:flex items-center gap-6">
          {!isAuthPage && !session && (
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Características</button>
              <button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors">Demo</button>
            </nav>
          )}

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {session ? (
            <div className="relative" ref={dropdownRef}>
              {/* AVATAR BUTTON */}
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`w-10 h-10 rounded-full bg-slate-800 border flex items-center justify-center text-slate-200 transition-all hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${userMenuOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10'}`}
              >
                 <User size={20} />
              </button>

              {/* DROPDOWN MENU */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden z-50">
                   
                   {/* User Info Header */}
                   <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cuenta</p>
                     <p className="text-sm font-bold text-white truncate" title={session.user.email}>
                       {session.user.email}
                     </p>
                   </div>

                   <div className="p-2 space-y-1">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutGrid size={16} className="text-cyan-400" /> Dashboard
                      </Link>

                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 transition-colors"
                        >
                          <Sparkles size={16} /> Admin Panel
                        </Link>
                      )}

                      {/* Placeholder para futura edición de perfil */}
                      <button 
                         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left opacity-50 cursor-not-allowed"
                         disabled
                      >
                        <Settings size={16} /> Configuración
                      </button>
                   </div>

                   <div className="border-t border-white/5 mt-1 p-2">
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                   </div>
                </div>
              )}
            </div>
          ) : (
            !isAuthPage && (
              <div className="flex items-center gap-4">
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Ingresar
                </Link>
                <Link 
                  to="/registro" 
                  className="group relative px-6 py-2.5 bg-white text-slate-950 text-sm font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <span className="relative z-10 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Comenzar <ChevronRight size={14} />
                  </span>
                </Link>
              </div>
            )
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          className="md:hidden text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-950 border-b border-white/10 p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-5 shadow-2xl">
           {!session ? (
             <>
               <button onClick={() => scrollToSection('features')} className="text-left text-slate-300 font-medium py-2">Características</button>
               <button onClick={() => scrollToSection('demo')} className="text-left text-slate-300 font-medium py-2">Demo</button>
               <div className="h-px bg-white/10 my-1"></div>
               <Link to="/login" className="block text-center py-3 text-slate-300 font-bold border border-white/10 rounded-xl">Ingresar</Link>
               <Link to="/registro" className="block text-center py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50">Crear Cuenta Gratis</Link>
             </>
           ) : (
             <>
                <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-2">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white">
                      <User size={20} />
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{session.user.email}</p>
                      <p className="text-xs text-slate-500">Sesión activa</p>
                   </div>
                </div>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-center py-3 bg-slate-800 text-white font-bold rounded-xl">Ir al Panel</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-center py-3 border border-amber-500/30 text-amber-400 font-bold rounded-xl">Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-center py-3 text-rose-400 font-bold hover:bg-rose-500/10 rounded-xl">Cerrar Sesión</button>
             </>
           )}
        </div>
      )}
    </header>
  );
}