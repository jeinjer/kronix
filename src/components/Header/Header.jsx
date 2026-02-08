import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Importamos useLocation
import { LogOut, User, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { session, user, logout, isSuperAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Obtenemos la ruta actual

  // Definimos si estamos en una página de autenticación
  const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-white/10 py-3' : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* LOGO */}
        <Link 
          to={user ? (isSuperAdmin ? "/admin" : "/dashboard") : "/"} 
          className="flex items-center gap-2 group"
        >
          <img src="/kronix.png" alt="Logo" className="w-9 h-9 invert group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">Kronix</span>
            <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase leading-none mt-1">By Tommasys</span>
          </div>
        </Link>

        {/* NAVEGACIÓN DINÁMICA */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-5">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border overflow-hidden ${
                isSuperAdmin ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-slate-800'
              }`}>
                {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2 bg-white text-slate-950 rounded-full hover:bg-cyan-500 hover:text-white transition-all shadow-lg group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* Solo mostramos estos botones si NO estamos en Login o Registro */
            !isAuthPage && (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">
                  Iniciar Sesión
                </Link>
                <Link to="/registro" className="px-6 py-2.5 bg-white text-slate-950 text-sm font-black rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center gap-1 uppercase tracking-tighter">
                  Comenzar <ChevronRight size={14} />
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}