import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutGrid, Menu, X, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { session, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hideNavRoutes = ['/login', '/registro', '/forgot-password', '/reset-password'];
  const isAuthPage = hideNavRoutes.includes(location.pathname);

  const handleLogout = async () => {
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

        <div className="hidden md:flex items-center gap-6">
          {!isAuthPage && !session && (
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Características</button>
              <button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors">Demo</button>
            </nav>
          )}

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {session ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-bold transition-all border border-white/5"
              >
                <LayoutGrid size={16} /> Panel
              </Link>
              
              {isAdmin && (
                <Link to="/admin" className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-full transition-colors" title="God Mode">
                  <Sparkles size={18} />
                </Link>
              )}

              <button 
                onClick={handleLogout} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
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

        <button 
          className="md:hidden text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

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
             <Link to="/dashboard" className="block text-center py-3 bg-slate-800 text-white font-bold rounded-xl">Ir al Panel</Link>
           )}
        </div>
      )}
    </header>
  );
}