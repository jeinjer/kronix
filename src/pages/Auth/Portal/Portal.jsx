import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase
} from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner";
import { getUserOrganizations } from "@/supabase/services/organizations";
import { getUserRole } from "@/supabase/services/users";
import HomeLoader from "@/components/Loaders/HomeLoader";
import { loadUserProfile } from "@/context/auth/profileService";
import { isSuperAdminUser } from "@/utils/superAdmin";

export default function AuthPortal({ isBusinessMode = false }) {
  const REGISTER_RETRY_DELAY_MS = 3000;

  const location = useLocation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(location.pathname.includes("/login"));
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [registerRetryBlocked, setRegisterRetryBlocked] = useState(false);
  const registerRetryTimerRef = useRef(null);

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    const basePath = isBusinessMode ? "/negocios" : "";
    window.history.pushState(null, "", basePath + (newMode ? "/login" : "/registro"));
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // 🔑 VALIDACIONES REALES
  const validations = [
    { label: "Mínimo 6 caracteres", valid: registerPassword.length >= 6 },
    { label: "Al menos 1 mayúscula", valid: /[A-Z]/.test(registerPassword) },
    { label: "Al menos 1 número", valid: /[0-9]/.test(registerPassword) },
    {
      label: "Las contraseñas coinciden",
      valid: registerConfirmPassword.length > 0 && registerPassword === registerConfirmPassword,
    },
  ];

  const allRequirementsMet = validations.every((v) => v.valid);
  
  const isLoginEmailValid = /^[^\s@]+@[^\s@]+\.com$/i.test(loginEmail.trim());
  const isRegisterEmailValid = /^[^\s@]+@[^\s@]+\.com$/i.test(registerEmail.trim());
  
  const isLoginFormValid = isLoginEmailValid && loginPassword;
  const isRegisterFormValid = isRegisterEmailValid && allRequirementsMet && !registerRetryBlocked;

  useEffect(() => {
    return () => {
      if (registerRetryTimerRef.current) {
        clearTimeout(registerRetryTimerRef.current);
      }
    };
  }, []);

  const getAuthErrorMessage = (err, loginMode) => {
    const rawMessage = String(err?.message || "").toLowerCase();
    const rawCode = String(err?.code || "").toLowerCase();

    if (loginMode) {
      if (
        rawCode === "email_not_confirmed" ||
        rawMessage.includes("email not confirmed")
      ) {
        return "Tu email todavía no está verificado. Revisá tu bandeja y confirmá la cuenta.";
      }

      if (
        rawCode === "invalid_credentials" ||
        rawMessage.includes("invalid login credentials") ||
        rawMessage.includes("invalid credentials")
      ) {
        return "Email o contraseña incorrectos.";
      }
    }

    return err?.message || "Error de autenticación";
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isLogin && registerRetryBlocked) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error } =
          await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });

        if (error) throw error;
        setRedirecting(true);

        toast.success("¡Bienvenido!");

        const [profileData, { data: orgs }] = await Promise.all([
          loadUserProfile(supabase, authData.user.id),
          getUserOrganizations(authData.user.id),
        ]);
        const { role: resolvedRole } = await getUserRole(
          authData.user.id,
          profileData?.barberia_id ?? null,
        );

        const userIsAdmin = isSuperAdminUser({
          user: authData?.user,
          profile: {
            ...profileData,
            user_role: resolvedRole ?? profileData?.user_role,
          },
        });

        if (userIsAdmin) {
          navigate("/admin", { replace: true });
          return;
        }

        navigate(orgs && orgs.length > 0 ? "/dashboard" : "/welcome", {
          replace: true,
        });
      } else {
        if (isBusinessMode) {
          const { data: invitacion } = await supabase
            .from("saas_invitations")
            .select("status")
            .eq("email", registerEmail)
            .maybeSingle();

          if (!invitacion) {
            throw new Error("Este email no tiene invitación técnica.");
          }

          const inviteStatus = String(invitacion.status ?? "").toLowerCase();
          if (
            ["inactive", "revoked", "blocked", "banned"].includes(inviteStatus)
          ) {
            throw new Error("Tu invitación está inactiva.");
          }
        }

        const { error } = await supabase.auth.signUp({ 
          email: registerEmail, 
          password: registerPassword,
        });
        if (error) throw error;

        toast.success("Cuenta creada. Verificá tu correo.");
        toggleMode();
      }
    } catch (err) {
      setRedirecting(false);
      if (!isLogin) {
        setRegisterRetryBlocked(true);
        if (registerRetryTimerRef.current) {
          clearTimeout(registerRetryTimerRef.current);
        }
        registerRetryTimerRef.current = setTimeout(() => {
          setRegisterRetryBlocked(false);
          registerRetryTimerRef.current = null;
        }, REGISTER_RETRY_DELAY_MS);
      }
      toast.error(getAuthErrorMessage(err, isLogin));
    } finally {
      setLoading(false);
    }
  };

  const spring = { type: "spring", stiffness: 150, damping: 20 };

  if (redirecting) {
    return <HomeLoader />;
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 min-h-[calc(100vh-96px)] relative font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] bg-[#f0f3fa]">
      {/* HEADER SECTION */}
      <div className="w-full max-w-[1000px] flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 relative gap-4">
        {/* LEFT: BACK BUTTON */}
        <div className="flex-1 flex justify-start w-full sm:w-auto">
          <button 
            onClick={() => {
              navigate(isBusinessMode ? "/negocios" : "/");
            }} 
            className="flex items-center gap-2 px-4 py-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:shadow-none hover:translate-y-[1px] hover:translate-x-[1px] bg-white text-slate-900 font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="hidden md:block">Volver al Inicio</span>
          </button>
        </div>

        {/* CENTER: MODE SWITCHER PILL */}
        <div className="flex justify-center flex-shrink-0">
          <div className="p-1 bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex items-center relative z-10 rounded-none">
            <Link
              to={isLogin ? "/login" : "/registro"}
              className={`flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-none text-[10px] sm:text-xs tracking-widest font-black uppercase transition-all ${
                !isBusinessMode 
                  ? "bg-cyan-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]" 
                  : "text-slate-500 border-2 border-transparent hover:bg-slate-100"
              }`}
            >
              <User size={14} strokeWidth={3} /> Clientes
            </Link>
            <Link
              to={isLogin ? "/negocios/login" : "/negocios/registro"}
              className={`flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-none text-[10px] sm:text-xs tracking-widest font-black uppercase transition-all ${
                isBusinessMode 
                  ? "bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]" 
                  : "text-slate-500 border-2 border-transparent hover:bg-slate-100"
              }`}
            >
              <Briefcase size={14} strokeWidth={3} /> Negocios
            </Link>
          </div>
        </div>

        {/* RIGHT: SPACER TO BALANCE CENTER */}
        <div className="flex-1 hidden sm:block"></div>
      </div>

      {/* MOBILE: Simple stacked layout */}
      <div className="block md:hidden w-full max-w-md">
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 sm:p-8 mb-6">
          <Header
            title={isLogin 
              ? (isBusinessMode ? "Portal de Negocios" : "Bienvenido")
              : (isBusinessMode ? "Activar Negocio" : "Crear Cuenta")}
            subtitle={isLogin
              ? (isBusinessMode ? "Gestión inteligente para tu emprendimiento." : "Inicia sesión para reservar tus turnos.")
              : (isBusinessMode ? "Exclusivo para negocios con invitación SaaS." : "Comienza a reservar tus turnos en segundos.")}
          />
          {isLogin ? (
            <FormContent
              isLogin
              email={loginEmail}
              setEmail={setLoginEmail}
              password={loginPassword}
              setPassword={setLoginPassword}
              showPass={showPass}
              setShowPass={setShowPass}
              onSubmit={handleAuth}
              loading={loading}
              valid={isLoginFormValid}
              registerRetryBlocked={registerRetryBlocked}
              isBusinessMode={isBusinessMode}
            />
          ) : (
            <FormContent
              isLogin={false}
              email={registerEmail}
              setEmail={setRegisterEmail}
              password={registerPassword}
              setPassword={setRegisterPassword}
              confirmPassword={registerConfirmPassword}
              setConfirmPassword={setRegisterConfirmPassword}
              showPass={showPass}
              setShowPass={setShowPass}
              showConfirmPass={showConfirmPass}
              setShowConfirmPass={setShowConfirmPass}
              validations={validations}
              onSubmit={handleAuth}
              loading={loading}
              valid={isRegisterFormValid}
              registerRetryBlocked={registerRetryBlocked}
              isBusinessMode={isBusinessMode}
            />
          )}
        </div>
        <div className="text-center">
          <button
            onClick={toggleMode}
            className="px-6 py-3 font-black uppercase tracking-widest text-sm flex items-center gap-2 cursor-pointer border-4 border-slate-900 text-slate-900 bg-yellow-400 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all mx-auto"
          >
            {isLogin ? (
              <>
                {isBusinessMode ? "ACTIVAR NEGOCIO" : "CREAR CUENTA"}
                <ArrowRight size={18} strokeWidth={3} />
              </>
            ) : (
              <>
                <ArrowLeft size={18} strokeWidth={3} />
                INICIAR SESIÓN
              </>
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP: Split panel with animation */}
      <div className="hidden md:block relative w-full max-w-[1000px] h-[600px] bg-white border-4 border-slate-900 shadow-[12px_12px_0_0_#0f172a] rounded-none overflow-hidden">
        {/* LOGIN */}
        <motion.div
          className="absolute left-0 top-0 w-1/2 h-full px-12 flex flex-col justify-center"
          animate={{ x: isLogin ? "0%" : "-100%", opacity: isLogin ? 1 : 0 }}
          transition={spring}
        >
          <Header
            title={isBusinessMode ? "Portal de Negocios" : "Bienvenido"}
            subtitle={isBusinessMode ? "Gestión inteligente para tu emprendimiento." : "Inicia sesión para reservar tus turnos."}
          />
          <FormContent
            isLogin
            email={loginEmail}
            setEmail={setLoginEmail}
            password={loginPassword}
            setPassword={setLoginPassword}
            showPass={showPass}
            setShowPass={setShowPass}
            onSubmit={handleAuth}
            loading={loading}
            valid={isLoginFormValid}
            registerRetryBlocked={registerRetryBlocked}
            isBusinessMode={isBusinessMode}
          />
        </motion.div>

        {/* REGISTER */}
        <motion.div
          className="absolute right-0 top-0 w-1/2 h-full px-12 flex flex-col justify-center"
          animate={{ x: isLogin ? "100%" : "0%", opacity: isLogin ? 0 : 1 }}
          transition={spring}
        >
          <Header
            title={isBusinessMode ? "Activar Negocio" : "Crear Cuenta"}
            subtitle={isBusinessMode ? "Exclusivo para negocios con invitación SaaS." : "Comienza a reservar tus turnos en segundos."}
          />
          <FormContent
            isLogin={false}
            email={registerEmail}
            setEmail={setRegisterEmail}
            password={registerPassword}
            setPassword={setRegisterPassword}
            confirmPassword={registerConfirmPassword}
            setConfirmPassword={setRegisterConfirmPassword}
            showPass={showPass}
            setShowPass={setShowPass}
            showConfirmPass={showConfirmPass}
            setShowConfirmPass={setShowConfirmPass}
            validations={validations}
            onSubmit={handleAuth}
            loading={loading}
            valid={isRegisterFormValid}
            registerRetryBlocked={registerRetryBlocked}
            isBusinessMode={isBusinessMode}
          />
        </motion.div>

        {/* OVERLAY */}
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full z-40 border-slate-900"
          animate={{ x: isLogin ? "100%" : "0%" }}
          transition={spring}
          style={{ borderLeftWidth: isLogin ? '4px' : '0px', borderRightWidth: !isLogin ? '4px' : '0px' }}
        >
          <div 
            className={`absolute inset-0 bg-slate-900`} 
          />
          <div className="relative h-full flex flex-col items-center justify-center text-white p-12 text-center">
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">
              {isLogin ? "¿Sos nuevo?" : "¿Ya tenés cuenta?"}
            </h2>
            <p className="mb-8 font-bold text-slate-300 uppercase tracking-widest text-sm">
              {isLogin
                ? isBusinessMode
                  ? "Activá tu cuenta de negocio SaaS desde acá."
                  : "Registrate gratis para agendar turnos rápidos."
                : isBusinessMode
                  ? "Ingresá al dashboard para gestionar tu negocio."
                  : "Ingresá a tu cuenta para ver tus turnos."}
            </p>
            <button
              onClick={toggleMode}
              className={`px-8 py-4 font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer border-4 border-slate-900 text-slate-900 bg-white hover:-translate-y-1 hover:-translate-x-1 transition-all shadow-[6px_6px_0_0_#FEE324] hover:shadow-[10px_10px_0_0_#FEE324] active:shadow-none active:translate-y-1 active:translate-x-1 ${isBusinessMode ? 'shadow-[6px_6px_0_0_#22d3ee] hover:shadow-[10px_10px_0_0_#22d3ee]' : ''}`}
            >
              {isLogin ? (
                <>
                  {isBusinessMode ? "ACTIVAR NEGOCIO" : "CREAR CUENTA"}
                  <ArrowRight size={20} strokeWidth={3} />
                </>
              ) : (
                <>
                  <ArrowLeft size={20} strokeWidth={3} />
                  INICIAR SESIÓN
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ===== SUBCOMPONENTES ===== */

function Header({ title, subtitle }) {
  return (
    <div className="mb-8 border-l-8 border-yellow-400 pl-4 py-1">
      <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter text-slate-900">{title}</h1>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{subtitle}</p>
    </div>
  );
}

function FormContent({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPass,
  setShowPass,
  showConfirmPass,
  setShowConfirmPass,
  validations = [],
  onSubmit,
  loading,
  valid,
  registerRetryBlocked = false,
  isBusinessMode = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" autoComplete="on">
      <Input
        icon={<Mail strokeWidth={3} size={20} />}
        value={email}
        onChange={setEmail}
        type="email"
        placeholder="tu@email.com"
        name={isLogin ? "username" : "email"}
        id={isLogin ? "login-email" : "register-email"}
        autoComplete={isLogin ? "username" : "email"}
      />
      <Input
        icon={<Lock strokeWidth={3} size={20} />}
        value={password}
        onChange={setPassword}
        type={showPass ? "text" : "password"}
        toggle={() => setShowPass(!showPass)}
        placeholder="*****"
        name={isLogin ? "current-password" : "new-password"}
        id={isLogin ? "login-password" : "register-password"}
        autoComplete={isLogin ? "current-password" : "new-password"}
      />

      {!isLogin && password.length > 0 && (
        <div className="flex flex-col gap-1 p-3 border-4 border-slate-900 bg-slate-50 shadow-[4px_4px_0_0_#FEE324]">
          {validations.map((v, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${v.valid ? "text-yellow-600" : "text-rose-600"}`}
            >
              {v.valid ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
              {v.label}
            </div>
          ))}
        </div>
      )}

      {!isLogin && (
        <Input
          icon={<Lock strokeWidth={3} size={20} />}
          value={confirmPassword}
          onChange={setConfirmPassword}
          type={showConfirmPass ? "text" : "password"}
          toggle={() => setShowConfirmPass(!showConfirmPass)}
          placeholder="*****"
          name="confirm-password"
          id="register-confirm-password"
          autoComplete="new-password"
        />
      )}

      <button
        disabled={loading}
        className={`w-full py-4 mt-2 text-slate-900 text-sm tracking-widest uppercase font-black rounded-none border-4 border-slate-900 cursor-pointer shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all ${
          !valid 
            ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none translate-x-0 translate-y-0" 
            : isBusinessMode ? "bg-cyan-400" : "bg-yellow-400"
        }`}
      >
        {loading
          ? "PROCESANDO…"
          : isLogin
            ? "INGRESAR AL SISTEMA"
            : registerRetryBlocked
              ? "ESPERÁ..."
              : "CREAR CUENTA AHORA"}
      </button>
    </form>
  );
}

function Input({
  icon,
  value,
  onChange,
  type,
  toggle,
  placeholder,
  name,
  id,
  autoComplete,
}) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 z-10 pointer-events-none transition-colors group-focus-within:text-yellow-500">
        {icon}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-12 pr-12 py-4 bg-white border-4 border-slate-900 rounded-none shadow-[4px_4px_0_0_#0f172a] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-black text-slate-900 tracking-wide"
      />
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
            type === "text" ? "text-cyan-600" : "text-slate-400"
          }`}
        >
          {type === "text" ? <Eye size={20} strokeWidth={3} /> : <EyeOff size={20} strokeWidth={3} />}
        </button>
      )}
    </div>
  );
}
