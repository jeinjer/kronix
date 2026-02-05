import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

// Importamos componentes visuales de los pasos
import IdentityStep from '../../components/Onboarding/IdentityStep';
import LocationStep from '../../components/Onboarding/LocationStep';
import IndustryStep from '../../components/Onboarding/IndustryStep';
import LoadingStep from '../../components/Onboarding/LoadingStep';

// Importamos TODOS los servicios necesarios desde el archivo unificado
import { 
    uploadOrganizationLogo, 
    createOrganization,
    getUserOrganizations 
} from '@/supabase/services/organizations';

import {
    getCurrentUser
} from '@/supabase/services/users';

// Componente de fondo animado
const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-slate-950"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
  </div>
);

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar la verificación inicial de seguridad
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    name: '', slug: '', logoPreview: null, logoFile: null,
    province: '', provinceId: '', city: '', cityId: '', street: '', number: '', industry: null
  });

  // --- 1. LÓGICA DE PROTECCIÓN (GUARD) ---
  useEffect(() => {
    const checkAccess = async () => {
      // A. Backdoor para desarrollo (?dev_mode=true en la URL)
      // Esto te permite entrar a probar aunque ya tengas empresa creada.
      const isDevMode = searchParams.get('dev_mode') === 'true';
      if (isDevMode) {
          console.warn("⚠️ MODO DESARROLLO ACTIVO: Saltando verificación de organización.");
          setCheckingAuth(false);
          return;
      }

      // B. Obtener usuario actual
      const { user } = await getCurrentUser();
      if (!user) {
          // Si no está logueado, al login
          navigate('/login');
          return;
      }

      // C. Consultar si ya tiene organizaciones
      const { data: orgs } = await getUserOrganizations(user.id);
      
      // D. Decisión de redirección
      if (orgs && orgs.length > 0) {
          // Ya tiene negocio -> Dashboard
          console.log("Usuario con organizaciones detectadas. Redirigiendo...");
          navigate('/dashboard');
      } else {
          // Es nuevo -> Permitir acceso al Onboarding
          setCheckingAuth(false);
      }
    };

    checkAccess();
  }, [navigate, searchParams]);


  // --- 2. HANDLERS DEL FORMULARIO ---

  // Generador automático de URL (Slug)
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Navegación entre pasos
  const handleNext = () => {
    if (step === 1 && formData.name && formData.slug && formData.logoFile) setStep(2);
    else if (step === 2 && formData.provinceId && formData.cityId && formData.street) setStep(3);
    else if (step === 3 && formData.industry) handleSubmit();
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };


  // --- 3. SUBMIT FINAL (CONECTADO A SUPABASE) ---
  const handleSubmit = async () => {
    setLoading(true);

    try {
        // A. Validar sesión nuevamente
        const { user, error: userError } = await getCurrentUser();
        if (userError || !user) throw new Error("Sesión expirada. Inicia sesión nuevamente.");

        // B. Subir Logo (Solo si hay archivo)
        let logoUrl = null;
        if (formData.logoFile) {
            // Usamos el servicio de subida que definimos
            const { url, error: uploadError } = await uploadOrganizationLogo(formData.logoFile, user.id);
            if (uploadError) throw new Error("Error al subir el logo: " + uploadError.message);
            logoUrl = url;
        }

        // C. Preparar objeto para la RPC
        const orgPayload = {
            name: formData.name,
            slug: formData.slug,
            logo_url: logoUrl,
            industry: formData.industry,
            province_id: parseInt(formData.provinceId),
            city_id: parseInt(formData.cityId),
            street: formData.street,
            number: formData.number
        };

        // D. Llamada a la Función SQL (RPC)
        const { data: responseData, error: rpcError } = await createOrganization(orgPayload);
        
        if (rpcError) throw new Error(rpcError.message);
        
        console.log("Organización creada exitosamente:", responseData);
        
        // E. Redirección final
        setTimeout(() => { 
            setLoading(false); 
            navigate('/dashboard'); 
        }, 1500);

    } catch (error) {
        console.error("Error crítico en onboarding:", error);
        setLoading(false);
        alert(error.message || "Ocurrió un error inesperado creando tu cuenta.");
    }
  };


  // --- 4. VALIDACIÓN VISUAL ---
  const isStepValid = () => {
    if (step === 1) return formData.name.length > 2 && formData.slug.length > 2 && formData.logoFile;
    if (step === 2) return formData.provinceId && formData.cityId && formData.street.length > 2;
    if (step === 3) return formData.industry;
    return false;
  };


  // --- 5. RENDERIZADO ---

  // Si estamos verificando si tiene empresas, mostramos un spinner de carga completa
  if (checkingAuth) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
              <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm animate-pulse">Verificando cuenta...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative">
      <BackgroundEffects />

      <div className="w-full max-w-2xl relative z-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
                 <img src="/kronix.svg" alt="Kronix" className="w-9 h-9 object-contain invert drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Alta de Sede</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Setup Inicial</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-slate-400">Paso <span className="text-white font-bold">{step}</span> de 3</p>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-visible">
          
          {/* BARRA DE PROGRESO */}
          <div className="h-1 bg-slate-800 w-full rounded-t-2xl overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-8 md:p-10 min-h-[520px] flex flex-col">
            <AnimatePresence mode="wait">
              
              {step === 1 && (
                <IdentityStep 
                  formData={formData} 
                  setFormData={setFormData} 
                  handleNameChange={handleNameChange} 
                />
              )}

              {step === 2 && (
                <LocationStep 
                  formData={formData} 
                  setFormData={setFormData} 
                />
              )}

              {step === 3 && (
                <IndustryStep 
                  formData={formData} 
                  setFormData={setFormData} 
                />
              )}

              {loading && <LoadingStep name={formData.name} />}

            </AnimatePresence>

            {/* BARRA DE NAVEGACIÓN INFERIOR */}
            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
              {step > 1 ? (
                <button onClick={handleBack} className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <ArrowLeft size={16} /> Volver
                </button>
              ) : ( <div></div> )}

              <button 
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={!isStepValid()}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${isStepValid() ? 'bg-white text-slate-950 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
              >
                {step === 3 ? 'Lanzar Plataforma' : 'Siguiente'} 
                {step !== 3 && <ArrowRight size={16} />}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}