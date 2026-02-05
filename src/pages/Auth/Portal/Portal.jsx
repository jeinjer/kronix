import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Check, X, ArrowRight, Layers, Zap } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner'; 

// IMPORTANTE: Importamos el servicio para verificar si tiene empresa
import { getUserOrganizations } from '@/supabase/services/organizations';

export default function AuthPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(location.pathname !== '/registro');
  const [loading, setLoading] = useState(false);
  
  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    window.history.pushState(null, '', newMode ? '/login' : '/registro');
  };

  const validations = [
    { label: "Mínimo 6 caracteres", valid: password.length >= 6 },
    { label: "Al menos 1 mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Al menos 1 número", valid: /[0-9]/.test(password) },
  ];
  const allRequirementsMet = validations.every(v => v.valid);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = isLogin ? (email && password) : (email && allRequirementsMet && passwordsMatch);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success("¡Bienvenido al sistema!");

        // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
        try {
            // Verificamos si tiene organizaciones
            const { data: orgs } = await getUserOrganizations(authData.user.id);

            if (orgs && orgs.length > 0) {
                // Ya tiene negocio -> Dashboard
                navigate('/dashboard');
            } else {
                // Es nuevo -> Bienvenida -> Onboarding
                navigate('/welcome');
            }
        } catch (err) {
            console.error("Error verificando orgs:", err);
            // Si falla la verificación, por seguridad al dashboard
            navigate('/dashboard'); 
        }
        
      } else {
        // --- REGISTRO ---
        
        // 1. Validar Whitelist
        const { data: suscripcion, error: whitelistError } = await supabase
          .from('suscripciones_saas')
          .select('estado')
          .eq('email', email)
          .maybeSingle(); 

        if (whitelistError) {
            console.error(whitelistError);
            throw new Error("Error verificando suscripción. Contactá soporte.");
        }

        if (!suscripcion) {
          throw new Error("Este email no tiene invitación. Contactá a ventas.");
        }

        if (suscripcion.estado === 'Inactiva') {
          throw new Error("Tu suscripción está inactiva.");
        }

        // 2. Registro en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email, 
            password 
        });

        if (authError) {
            if (authError.message.includes("already registered")) {
                throw new Error("Ya existe una cuenta con este email. Iniciá sesión.");
            }
            throw authError;
        }

        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
             throw new Error("Este email ya está registrado. Por favor iniciá sesión.");
        }
        
        toast.success("Cuenta creada. Verificá tu correo.");
        toggleMode();
      }
    } catch (error) {
      toast.error(error.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const springTransition = { type: "spring", stiffness: 150, damping: 20, mass: 0.8 };

  // Clases dinámicas
  const cardBg = "bg-white dark:bg-[#13131a]";
  const cardBorder = "border-slate-200 dark:border-white/5";
  const inputBg = "bg-slate-50 dark:bg-[#0a0a0f]";
  const inputBorder = "border-slate-200 dark:border-white/10";
  const textMain = "text-slate-900 dark:text-white";
  const textMuted = "text-slate-500 dark:text-slate-400";

  return (
    <div className="flex items-center justify-center py-10 px-4 font-sans">
      
      {/* Main Container */}
      <div className={`relative w-full max-w-[1000px] h-[650px] ${cardBg} rounded-[2rem] shadow-2xl overflow-hidden border ${cardBorder} transition-colors duration-300`}>
        
        {/* LOGIN FORM */}
        <motion.div 
          className="absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-12 z-10"
          animate={{ x: isLogin ? "0%" : "-100%", opacity: isLogin ? 1 : 0 }}
          transition={springTransition}
        >
          <BrandHeader title="Bienvenido" subtitle="Gestión inteligente para tu negocio." textMain={textMain} textMuted={textMuted} />
          <FormContent 
            isLogin={true} 
            email={email} setEmail={setEmail} 
            password={password} setPassword={setPassword}
            showPass={showPass} setShowPass={setShowPass}
            onSubmit={handleAuth} loading={loading} valid={isFormValid}
            inputBg={inputBg} inputBorder={inputBorder} textMain={textMain}
          />
        </motion.div>

        {/* REGISTER FORM */}
        <motion.div 
          className="absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-12 z-10"
          animate={{ x: isLogin ? "100%" : "0%", opacity: isLogin ? 0 : 1 }}
          transition={springTransition}
        >
          <BrandHeader title="Activar Cuenta" subtitle="Exclusivo para clientes con suscripción." textMain={textMain} textMuted={textMuted} />
          <FormContent 
            isLogin={false}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            showPass={showPass} setShowPass={setShowPass}
            showConfirmPass={showConfirmPass} setShowConfirmPass={setShowConfirmPass}
            onSubmit={handleAuth} loading={loading} valid={isFormValid}
            validations={validations} passwordsMatch={passwordsMatch}
            inputBg={inputBg} inputBorder={inputBorder} textMain={textMain}
          />
        </motion.div>


        {/* SLIDING OVERLAY */}
        <motion.div 
          className="absolute top-0 left-0 w-1/2 h-full z-50 overflow-hidden"
          animate={{ x: isLogin ? "100%" : "0%" }}
          transition={springTransition}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-[#020617] w-full h-full">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-indigo-500/10 blur-[100px] animate-pulse"></div>
          </div>

          <div className="relative h-full flex flex-col items-center justify-center text-center p-12 text-white">
            <motion.div
              key={isLogin ? "login-overlay" : "register-overlay"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 p-4 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                {isLogin ? <Zap size={40} className="text-cyan-400" /> : <Layers size={40} className="text-indigo-400" />}
              </div>
              
              <h2 className="text-4xl font-black mb-4 tracking-tighter">
                {isLogin ? "¿Sos Nuevo?" : "¿Ya tenés cuenta?"}
              </h2>
              
              <p className="text-indigo-200/80 mb-8 max-w-xs font-medium leading-relaxed">
                {isLogin 
                  ? "Si contrataste nuestro servicio SaaS, activá tu usuario acá." 
                  : "Ingresá al dashboard para gestionar tu facturación y métricas."}
              </p>

              <button 
                onClick={toggleMode}
                className="group relative px-10 py-4 bg-white text-indigo-950 font-black rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLogin ? "ACTIVAR MEMBRESÍA" : "INICIAR SESIÓN"}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Subcomponentes
function BrandHeader({ title, subtitle, textMain, textMuted }) {
  return (
    <div className="mb-8">
      <h1 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${textMain}`}>{title}</h1>
      <p className={`text-sm font-medium ${textMuted}`}>{subtitle}</p>
    </div>
  );
}

function FormContent({ 
  isLogin, email, setEmail, password, setPassword, 
  confirmPassword, setConfirmPassword, 
  showPass, setShowPass, showConfirmPass, setShowConfirmPass,
  onSubmit, loading, valid, validations,
  inputBg, inputBorder, textMain
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Autorizado</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="email" 
            required
            className={`w-full pl-12 pr-4 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400`}
            placeholder="usuario@negocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Contraseña</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type={showPass ? "text" : "password"}
            required
            className={`w-full pl-12 pr-12 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors">
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {!isLogin && password.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-2 p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
          {validations.map((v, i) => (
            <div key={i} className={`flex items-center gap-1.5 text-[10px] ${v.valid ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {v.valid ? <Check size={10} /> : <X size={10} />}
              <span className={v.valid ? 'font-bold' : ''}>{v.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {!isLogin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Confirmar Clave</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type={showConfirmPass ? "text" : "password"}
              required
              className={`w-full pl-12 pr-12 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-400`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors">
              {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>
      )}

      <button 
        disabled={!valid || loading}
        className="w-full py-4 mt-2 bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 hover:bg-slate-800 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 group transform active:scale-[0.98]"
      >
        {loading ? 'PROCESANDO...' : (isLogin ? 'INGRESAR' : 'REGISTRARME')}
        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
      </button>

      {isLogin && (
        <div className="text-center pt-2">
            <a href="/forgot-password" className="text-xs text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">¿Olvidaste tu contraseña?</a>
        </div>
      )}
    </form>
  );
}