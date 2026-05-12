import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

// Importamos componentes visuales de los pasos
import IdentityStep from "../../components/Onboarding/IdentityStep";
import LocationStep from "../../components/Onboarding/LocationStep";
import IndustryStep from "../../components/Onboarding/IndustryStep";
import LoadingStep from "../../components/Onboarding/LoadingStep";

// Importamos TODOS los servicios necesarios desde el archivo unificado
import {
  uploadOrganizationLogo,
  createOrganization,
  getUserOrganizations,
} from "@/supabase/services/organizations";

import { getCurrentUser } from "@/supabase/services/users";
import { supabase } from "@/supabase/supabaseClient";
import { loadUserProfile } from "@/context/auth/profileService";
import { Toaster, toast } from "sonner";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estado para controlar la verificaciÃ³n inicial de seguridad
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logoPreview: null,
    logoFile: null,
    province: "",
    provinceId: "",
    city: "",
    cityId: "",
    street: "",
    number: "",
    industry: null,
    lat: null,
    lng: null,
  });

  // --- 1. LÃ“GICA DE PROTECCIÃ“N (GUARD) ---
  useEffect(() => {
    const checkAccess = async () => {
      // A. Backdoor para desarrollo (?dev_mode=true en la URL)
      // Esto te permite entrar a probar aunque ya tengas empresa creada.
      const isDevMode = searchParams.get("dev_mode") === "true";
      if (isDevMode) {
        console.warn(
          "âš ï¸  MODO DESARROLLO ACTIVO: Saltando verificaciÃ³n de organizaciÃ³n.",
        );
        setCheckingAuth(false);
        return;
      }

      // B. Obtener usuario actual
      const { user } = await getCurrentUser();
      if (!user) {
        // Si no estÃ¡ logueado, al login
        navigate("/login");
        return;
      }

      const profile = await loadUserProfile(supabase, user.id);
      const profileFullName = String(
        profile?.full_name || user?.user_metadata?.full_name || "",
      ).trim();
      const profilePhone = String(
        profile?.phone || user?.user_metadata?.phone || "",
      ).trim();

      if (!profileFullName || !profilePhone) {
        navigate("/welcome");
        return;
      }

      // C. Consultar si ya tiene organizaciones
      const { data: orgs } = await getUserOrganizations(user.id);

      // D. DecisiÃ³n de redirecciÃ³n
      if (orgs && orgs.length > 0) {
        // Ya tiene negocio -> Dashboard
        console.log("Usuario con organizaciones detectadas. Redirigiendo...");
        navigate("/dashboard");
      } else {
        // Es nuevo -> Permitir acceso al Onboarding
        setCheckingAuth(false);
      }
    };

    checkAccess();
  }, [navigate, searchParams]);

  // --- 2. HANDLERS DEL FORMULARIO ---

  // Generador automÃ¡tico de URL (Slug)
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  // NavegaciÃ³n entre pasos
  const handleNext = () => {
    if (step === 1 && formData.name && formData.slug && formData.logoFile) {
      setStep(2);
    } else if (
      step === 2 &&
      formData.provinceId &&
      formData.cityId &&
      formData.street
    ) {
      setStep(3);
    } else if (step === 3 && formData.industry) {
       handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- 3. SUBMIT FINAL (CONECTADO A SUPABASE) ---
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // A. Validar sesiÃ³n nuevamente
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user)
        throw new Error("SesiÃ³n expirada. Inicia sesiÃ³n nuevamente.");

      // B. Subir Logo (Solo si hay archivo)
      let logoUrl = null;
      if (formData.logoFile) {
        // Usamos el servicio de subida que definimos
        const { url, error: uploadError } = await uploadOrganizationLogo(
          formData.logoFile,
          user.id,
        );
        if (uploadError)
          throw new Error("Error al subir el logo: " + uploadError.message);
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
        number: formData.number,
      };

      // D. Llamada a la Función SQL (RPC)
      const { data: responseData, error: rpcError } =
        await createOrganization(orgPayload);

      if (rpcError) throw new Error(rpcError.message);

      // Save coords if they exist
      if (formData.lat && formData.lng) {
        try {
          await supabase
            .from("organizations")
            .update({ lat: formData.lat, lon: formData.lng })
            .eq("slug", formData.slug);
        } catch(e) {
          console.error("Error saving coords:", e);
        }
      }

      toast.success("¡Sede creada con éxito!", { id: "onboard-success" });

      // E. Redirección final
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error crítico en onboarding:", error);
      setLoading(false);
      toast.error(error.message || "Ocurrió un error inesperado.", {
        id: "onboard-error",
      });
    }
  };

  // --- 4. VALIDACIÃ“N VISUAL ---
  const isStepValid = () => {
    if (step === 1)
      return (
        formData.name.length > 2 &&
        formData.slug.length > 2 &&
        formData.logoFile
      );
    if (step === 2)
      return (
        formData.provinceId && formData.cityId && formData.street.length > 2
      );
    if (step === 3) return formData.industry;
    return false;
  };

  // --- 5. RENDERIZADO ---

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f0f3fa] flex flex-col items-center justify-center font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] transition-colors duration-500">
        <Loader2 size={64} className="text-slate-900 animate-spin mb-4" strokeWidth={3} />
        <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">
          Verificando cuenta...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center p-4 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] text-slate-900 relative transition-colors duration-500 overflow-hidden">
      
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '4px solid #0f172a',
            borderRadius: '0',
            boxShadow: '6px 6px 0 0 #0f172a',
            color: '#0f172a',
            fontFamily: 'System-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#4ade80', // green-400
            },
          },
          error: {
            style: {
              background: '#f87171', // red-400
            },
          },
        }}
      />

      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#0f172a_2px,transparent_2px)] [background-size:32px_32px]"></div>
      
      <div className="w-full max-w-[800px] relative z-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center transform -rotate-6">
              <span className="font-black text-xl text-slate-900">K</span>
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Alta de negocio
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-white border-2 border-slate-900 px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Completa los datos de tu negocio
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
             <div className="bg-white border-4 border-slate-900 px-4 py-2 shadow-[4px_4px_0_0_#0f172a] font-black uppercase text-sm tracking-widest">
               Paso <span className="text-yellow-500">{step}</span> / 3
             </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-white border-4 border-slate-900 rounded-none shadow-[12px_12px_0_0_#0f172a] relative overflow-visible transition-colors duration-500">
          
          {/* BARRA DE PROGRESO */}
          <div className="h-5 bg-slate-100 border-b-4 border-slate-900 w-full overflow-hidden relative">
            <div className="absolute inset-x-0 inset-y-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.2)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.2)_75%,rgba(0,0,0,0.2)_100%)] bg-[length:20px_20px]"></div>
            <motion.div
              className={`h-full ${step === 3 ? 'bg-yellow-400' : 'bg-cyan-400'} border-r-4 border-slate-900`}
              initial={{ width: "0%" }}
              animate={{
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-8 md:p-12 min-h-[550px] flex flex-col pt-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <IdentityStep
                  formData={formData}
                  setFormData={setFormData}
                  handleNameChange={handleNameChange}
                />
              )}

              {step === 2 && (
                <LocationStep formData={formData} setFormData={setFormData} />
              )}

              {step === 3 && (
                <IndustryStep formData={formData} setFormData={setFormData} />
              )}

              {loading && <LoadingStep name={formData.name} />}
            </AnimatePresence>

            {/* BARRA DE NAVEGACIÃ“N INFERIOR */}
            <div className="mt-8 flex items-center justify-between border-t-4 border-slate-900 pt-8 pt-8">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="bg-white border-4 border-slate-900 px-6 py-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={18} strokeWidth={3} /> Volver
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={!isStepValid()}
                className={`flex items-center gap-2 px-8 py-4 font-black text-sm uppercase tracking-widest transition-all duration-300 border-4 border-slate-900 ${isStepValid() ? "bg-yellow-400 text-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#0f172a] shadow-[4px_4px_0_0_#0f172a] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none border-dashed"}`}
              >
                {step === 3 ? "Finalizar" : "Siguiente"}
                {step !== 3 && <ArrowRight size={18} strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
