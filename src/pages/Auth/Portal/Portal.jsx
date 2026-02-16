import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Layers,
  Zap
} from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { getUserOrganizations } from '@/supabase/services/organizations';
import { getUserRole } from '@/supabase/services/users';
import HomeLoader from '@/components/Loaders/HomeLoader';
import { loadUserProfile } from '@/context/auth/profileService';
import { isSuperAdminUser } from '@/utils/superAdmin';

export default function AuthPortal() {
  const REGISTER_RETRY_DELAY_MS = 3000;

  const location = useLocation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(location.pathname !== '/registro');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [registerRetryBlocked, setRegisterRetryBlocked] = useState(false);
  const registerRetryTimerRef = useRef(null);

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

  // 🔑 VALIDACIONES REALES (ACÁ ESTÁ LA CLAVE)
  const validations = [
    { label: 'Mínimo 6 caracteres', valid: password.length >= 6 },
    { label: 'Al menos 1 mayúscula', valid: /[A-Z]/.test(password) },
    { label: 'Al menos 1 número', valid: /[0-9]/.test(password) },
    {
      label: 'Las contraseñas coinciden',
      valid: confirmPassword.length > 0 && password === confirmPassword
    }
  ];

  const allRequirementsMet = validations.every(v => v.valid);
  const isRegisterEmailValid = /^[^\s@]+@[^\s@]+\.com$/i.test(email.trim());
  const isFormValid = isLogin
    ? isRegisterEmailValid && password
    : isRegisterEmailValid && allRequirementsMet && !registerRetryBlocked;

  useEffect(() => {
    return () => {
      if (registerRetryTimerRef.current) {
        clearTimeout(registerRetryTimerRef.current);
      }
    };
  }, []);

  const getAuthErrorMessage = (err, loginMode) => {
    const rawMessage = String(err?.message || '').toLowerCase();
    const rawCode = String(err?.code || '').toLowerCase();

    if (loginMode) {
      if (
        rawCode === 'email_not_confirmed' ||
        rawMessage.includes('email not confirmed')
      ) {
        return 'Tu email todavía no está verificado. Revisá tu bandeja y confirmá la cuenta.';
      }

      if (
        rawCode === 'invalid_credentials' ||
        rawMessage.includes('invalid login credentials') ||
        rawMessage.includes('invalid credentials')
      ) {
        return 'Email o contraseña incorrectos.';
      }
    }

    return err?.message || 'Error de autenticación';
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isLogin && registerRetryBlocked) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error } =
          await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;
        setRedirecting(true);

        toast.success('¡Bienvenido!');

        const [profileData, { data: orgs }] = await Promise.all([
          loadUserProfile(supabase, authData.user.id),
          getUserOrganizations(authData.user.id)
        ]);
        const { role: resolvedRole } = await getUserRole(
          authData.user.id,
          profileData?.barberia_id ?? null
        );

        const userIsAdmin = isSuperAdminUser({
          user: authData?.user,
          profile: { ...profileData, user_role: resolvedRole ?? profileData?.user_role }
        });

        if (userIsAdmin) {
          navigate('/admin', { replace: true });
          return;
        }

        navigate(orgs && orgs.length > 0 ? '/dashboard' : '/welcome', { replace: true });
      } else {
        const { data: invitacion } = await supabase
          .from('saas_invitations')
          .select('status')
          .eq('email', email)
          .maybeSingle();

        if (!invitacion) {
          throw new Error('Este email no tiene invitación.');
        }

        const inviteStatus = String(invitacion.status ?? '').toLowerCase();
        if (['inactive', 'revoked', 'blocked', 'banned'].includes(inviteStatus)) {
          throw new Error('Tu invitación está inactiva.');
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        toast.success('Cuenta creada. Verificá tu correo.');
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

  const spring = { type: 'spring', stiffness: 150, damping: 20 };

  if (redirecting) {
    return <HomeLoader />;
  }

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <div className="relative w-full max-w-[1000px] h-[650px] bg-white dark:bg-[#13131a] rounded-[2rem] shadow-2xl overflow-hidden border dark:border-white/5">

        {/* LOGIN */}
        <motion.div
          className="absolute left-0 top-0 w-1/2 h-full px-12 flex flex-col justify-center"
          animate={{ x: isLogin ? '0%' : '-100%', opacity: isLogin ? 1 : 0 }}
          transition={spring}
        >
          <Header title="Bienvenido" subtitle="Gestión inteligente para tu negocio." />
          <FormContent
            isLogin
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPass={showPass}
            setShowPass={setShowPass}
            onSubmit={handleAuth}
            loading={loading}
            valid={isFormValid}
            registerRetryBlocked={registerRetryBlocked}
          />
        </motion.div>

        {/* REGISTER */}
        <motion.div
          className="absolute right-0 top-0 w-1/2 h-full px-12 flex flex-col justify-center"
          animate={{ x: isLogin ? '100%' : '0%', opacity: isLogin ? 0 : 1 }}
          transition={spring}
        >
          <Header title="Activar Cuenta" subtitle="Exclusivo para clientes con suscripción." />
          <FormContent
            isLogin={false}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPass={showPass}
            setShowPass={setShowPass}
            showConfirmPass={showConfirmPass}
            setShowConfirmPass={setShowConfirmPass}
            validations={validations}
            onSubmit={handleAuth}
            loading={loading}
            valid={isFormValid}
            registerRetryBlocked={registerRetryBlocked}
          />
        </motion.div>

        {/* OVERLAY */}
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full z-40"
          animate={{ x: isLogin ? '100%' : '0%' }}
          transition={spring}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-[#020617]" />
          <div className="relative h-full flex flex-col items-center justify-center text-white p-12 text-center">
            <div className="mb-6 p-4 bg-white/10 rounded-full">
              {isLogin ? <Zap size={40} /> : <Layers size={40} />}
            </div>
            <h2 className="text-4xl font-black mb-4">
              {isLogin ? '¿Sos nuevo?' : '¿Ya tenés cuenta?'}
            </h2>
            <p className="mb-8 opacity-80">
              {isLogin
                ? 'Activá tu cuenta SaaS desde acá.'
                : 'Ingresá al dashboard para gestionar tu negocio.'}
            </p>
            <button
              onClick={toggleMode}
              className="px-10 py-4 bg-white text-indigo-900 font-black rounded-full flex items-center gap-2 cursor-pointer"
            >
              {isLogin ? (
                <>
                  ACTIVAR MEMBRESÍA
                  <ArrowRight size={20} />
                </>
              ) : (
                <>
                  <ArrowLeft size={20} />
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
    <div className="mb-8">
      <h1 className="text-3xl font-black mb-2">{title}</h1>
      <p className="text-slate-400">{subtitle}</p>
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
  registerRetryBlocked = false
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
      <Input
        icon={<Mail />}
        value={email}
        onChange={setEmail}
        type="email"
        placeholder="tu@email.com"
        name={isLogin ? 'username' : 'email'}
        id={isLogin ? 'login-email' : 'register-email'}
        autoComplete={isLogin ? 'username' : 'email'}
      />
      <Input
        icon={<Lock />}
        value={password}
        onChange={setPassword}
        type={showPass ? 'text' : 'password'}
        toggle={() => setShowPass(!showPass)}
        placeholder="*****"
        name={isLogin ? 'current-password' : 'new-password'}
        id={isLogin ? 'login-password' : 'register-password'}
        autoComplete={isLogin ? 'current-password' : 'new-password'}
      />

      {!isLogin && password.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 rounded-xl">
          {validations.map((v, i) => (
            <div key={i} className={`flex items-center gap-1 text-xs ${v.valid ? 'text-cyan-400' : 'text-rose-400'}`}>
              {v.valid ? <Check size={12} /> : <X size={12} />}
              {v.label}
            </div>
          ))}
        </div>
      )}

      {!isLogin && (
        <Input
          icon={<Lock />}
          value={confirmPassword}
          onChange={setConfirmPassword}
          type={showConfirmPass ? 'text' : 'password'}
          toggle={() => setShowConfirmPass(!showConfirmPass)}
          placeholder="*****"
          name="confirm-password"
          id="register-confirm-password"
          autoComplete="new-password"
        />
      )}

      <button
        disabled={!valid || loading}
        className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl disabled:opacity-30 cursor-pointer"
      >
        {loading ? 'PROCESANDO…' : isLogin ? 'INGRESAR' : registerRetryBlocked ? 'ESPERÁ...' : 'REGISTRARME'}
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
  autoComplete
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">{icon}</span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-12 pr-12 py-4 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl outline-none focus:border-cyan-500/60"
      />
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer ${
            type === 'text' ? 'text-cyan-400' : 'opacity-60'
          }`}
        >
          {type === 'text' ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      )}
    </div>
  );
}
 
