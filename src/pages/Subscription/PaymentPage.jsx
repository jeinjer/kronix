import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getPlans } from '../../supabase/services/plans';

const brutalistButton = "w-full font-black uppercase tracking-wider py-4 border-2 border-slate-900 rounded-none shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all active:shadow-none bg-cyan-400 text-slate-900 flex items-center justify-center gap-2 relative overflow-hidden group";
const brutalistInput = "w-full border-2 border-slate-900 p-3 rounded-none bg-white focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_#0f172a] focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all font-medium";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const planId = searchParams.get('plan');
  const modo = searchParams.get('modo') || 'mensual';
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', document: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!planId) {
      navigate('/negocios');
      return;
    }

    getPlans().then(({ data }) => {
      const selectedPlan = data.find(p => p.id === planId);
      if (selectedPlan) {
        setPlan(selectedPlan);
      } else {
        navigate('/negocios');
      }
      setLoading(false);
    });
  }, [planId, navigate]);

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate MercadoPago processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2500);
  };

  if (loading) return <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-900 border-t-cyan-400 animate-spin"></div></div>;

  const finalPrice = modo === 'anual' ? plan.price * 10 : plan.price;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#2dd4bf] text-center">
          <div className="w-20 h-20 bg-yellow-400 border-4 border-slate-900 mx-auto rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] mb-6">
            <CheckCircle2 size={40} className="text-slate-900" />
          </div>
          <h2 className="text-3xl font-black uppercase text-slate-900 mb-4 tracking-tighter">¡Pago Exitoso!</h2>
          <p className="text-slate-600 font-medium mb-6">Hemos enviado un correo a <strong className="text-cyan-600">{formData.email}</strong> con las instrucciones para crear y activar tu cuenta en Kronix.</p>
          
          <div className="bg-slate-100 border-2 border-slate-900 p-4 mb-8 text-left text-sm font-medium">
            <p className="mb-2"><strong>Pasos a seguir:</strong></p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Revisa tu bandeja de entrada o SPAM.</li>
              <li>Abre el mail con asunto "Bienvenido a Kronix".</li>
              <li>Haz clic en "Activar mi cuenta".</li>
              <li>Regístrate utilizando exactamente tu mail <strong>{formData.email}</strong>.</li>
            </ol>
          </div>
          
          <Link to="/negocios/registro" className={brutalistButton + " bg-slate-900 text-cyan-400 border-none"}>
            Ir al Registro
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3fa] py-20 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-10">
        <Link to="/negocios" className="font-black text-slate-900 flex items-center gap-2 hover:text-cyan-600 transition-colors uppercase"><ArrowLeft size={20} /> Volver</Link>
        <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">Kronix <span className="text-cyan-600">Pay</span></div>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        {/* Checkout Form */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white border-4 border-slate-900 p-6 md:p-8 shadow-[12px_12px_0_0_#0f172a] relative">
          <div className="absolute -top-4 -right-4 bg-cyan-400 border-2 border-slate-900 px-4 py-1 font-black uppercase text-xs shadow-[2px_2px_0_0_#0f172a] transform rotate-3 flex items-center gap-1">
             MercadoPago <CreditCard size={14} />
          </div>
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block pb-1">Datos de Facturación</h2>
          
          <form onSubmit={handlePayment} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Nombre Completo</label>
              <input required type="text" className={brutalistInput} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Correo Electrónico (Fundamental)</label>
              <input required type="email" className={brutalistInput} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Para recibir el acceso" />
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Deberás usar este mail en el registro.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Teléfono</label>
                  <input required type="tel" className={brutalistInput} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+54 9 11 1234 5678" />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">DNI / CUIT</label>
                  <input required type="text" className={brutalistInput} value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="Documento" />
               </div>
            </div>

            <div className="pt-6">
              <button disabled={isProcessing} type="submit" className={brutalistButton + " bg-yellow-400"}>
                {isProcessing ? "Procesando el pago..." : `Pagar $${finalPrice.toLocaleString('es-AR')}`} 
              </button>
            </div>
          </form>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-900 border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0_0_#2dd4bf] text-white">
          <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-yellow-400 border-b-2 border-slate-700 pb-3">Tu Selección</h3>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase">Plan</p>
              <p className="text-2xl font-black uppercase">{plan.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase">Facturación</p>
              <p className="text-lg font-black uppercase text-cyan-400">{modo}</p>
            </div>
          </div>

          <div className="space-y-3 mb-8 border-t border-slate-700 pt-6">
             {plan.features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                   <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                   <span className="text-sm font-medium">{f}</span>
                </div>
             ))}
             {plan.features.length > 4 && <div className="text-xs text-slate-400 italic ml-6">+ más beneficios incluidos</div>}
          </div>

          <div className="bg-slate-800 p-4 border-l-4 border-yellow-400">
             <div className="flex justify-between items-center text-xl font-black">
                <span className="uppercase tracking-widest text-sm">Total a pagar:</span>
                <span className="text-3xl">${finalPrice.toLocaleString("es-AR")}</span>
             </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center"><CreditCard size={10} className="text-white"/></span> 
            Pagos seguros por MercadoPago
          </div>
        </motion.div>
      </div>
    </div>
  );
}
