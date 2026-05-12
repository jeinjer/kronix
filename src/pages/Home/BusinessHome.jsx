import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, BarChart3, CheckCircle2, MessageSquare, MapPin, Search, Sparkles, Navigation, Clock, Building2, Store, Map as MapIcon, ArrowRight, X } from "lucide-react";
import { getPlans } from "../../supabase/services/plans";

// CSS for brutalist theme applied directly via Tailwind arbitrary values
const brutalistCard = "w-full bg-white border-2 border-slate-900 rounded-lg shadow-[6px_6px_0_0_rgba(15,23,42,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_rgba(15,23,42,1)] transition-all duration-200";
const brutalistButton = "w-full font-black uppercase tracking-wider text-sm py-4 border-2 border-slate-900 rounded-md shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all active:shadow-none bg-cyan-400 text-slate-900 flex items-center justify-center gap-2 relative overflow-hidden group";

export default function BusinessHome() {
  const [plans, setPlans] = useState([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getPlans().then(({ data }) => setPlans(data));
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="bg-[#f0f3fa] min-h-screen font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] text-slate-900 selection:bg-cyan-500/40 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex-1 text-center lg:text-left z-10 w-full">
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[76px] font-black tracking-tighter text-slate-900 mb-8 leading-[1]">
              Tu agenda está <br/>
              <span className="relative inline-block text-white px-4 py-1 mt-2 transform -rotate-1 border-4 border-slate-900 bg-cyan-500 shadow-[6px_6px_0_0_#0f172a]">
                evolucionando.
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Automatiza reservas con <b>Kronia</b>, gestiona franquicias y domina tu mercado. El sistema de gestión que los negocios serios eligen.
            </p>

            <div className="inline-flex gap-4">
              <a href="#pricing" className={brutalistButton + " w-auto px-8 py-4 bg-yellow-400 text-lg"}>Ver los planes</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50, rotateZ: 3 }} animate={{ opacity: 1, x: 0, rotateZ: -1 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex-1 w-full max-w-lg lg:max-w-none relative z-0">
            {/* Mock Real UserPanel Agenda */}
            <div className="relative bg-white border-4 border-slate-900 shadow-[12px_12px_0_0_#2dd4bf] p-0 overflow-hidden transform hover:-translate-y-2 hover:-translate-x-2 transition-transform duration-300">
               <div className="bg-slate-900 px-5 py-4 border-b-4 border-slate-900 flex justify-between items-center">
                 <h2 className="text-white font-black uppercase text-lg flex items-center gap-2"><Clock size={20} className="text-cyan-400"/> Panel de Control</h2>
                 <span className="bg-cyan-400 text-slate-900 font-black px-2 py-1 text-[10px] uppercase">Hoy</span>
               </div>
               
               <div className="p-0 bg-white">
                  {[
                    { time: "14:00 - 15:00", client: "Martita Sanchez", service: "Corte y peinado", status: "Confirmado" },
                    { time: "15:30 - 16:30", client: "Lucas Fernandez", service: "Claritos", status: "Pendiente" },
                    { time: "17:00 - 18:00", client: "Andrea Gomez", service: "Tintura", status: "Confirmado" }
                  ].map((turno, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b-2 border-slate-300 hover:bg-[#f0f3fa] transition-colors last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-black text-slate-900 w-28 whitespace-nowrap bg-white border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a] -rotate-1">{turno.time}</div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 ml-2">{turno.client}</h4>
                          <p className="text-xs text-slate-600 font-bold ml-2 uppercase tracking-tight">{turno.service}</p>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 lg:ml-auto">
                        <span className={`inline-flex items-center justify-center px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 ${turno.status === "Confirmado" ? "bg-yellow-300 border-yellow-900 text-yellow-900 shadow-[2px_2px_0_0_#713f12]" : "bg-orange-300 border-orange-900 text-orange-900 shadow-[2px_2px_0_0_#7c2d12]"}`}>
                          {turno.status === "Confirmado" && <CheckCircle2 size={12} strokeWidth={3} className="mr-1" />}
                          {turno.status}
                        </span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Bot - KRONIA Section */}
      <section id="whatsapp" className="py-24 bg-cyan-400 border-y-4 border-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 w-full max-w-sm mx-auto perspective-[2000px]">
              <motion.div initial={{ rotateY: -15, opacity: 0 }} whileInView={{ rotateY: 0, opacity: 1 }} viewport={{ once: true }} className="bg-white border-4 border-slate-900 p-0 shadow-[16px_16px_0_0_#0f172a] rounded-none">
                 <div className="bg-[#e5ddd5] overflow-hidden h-[450px] flex flex-col relative w-full border-b-4 border-slate-900">
                    <div className="bg-[#075e54] p-3 text-white flex items-center gap-3 border-b-2 border-white/20">
                       <div className="w-10 h-10 bg-white border-2 border-slate-900 flex items-center justify-center text-[#075e54] font-black text-xl shadow-[2px_2px_0_0_#0f172a] transform rotate-3">K</div>
                       <div>
                         <h4 className="font-black tracking-tight leading-none text-[17px]">Kronia</h4>
                         <p className="text-[11px] font-medium opacity-90 mt-0.5">en línea</p>
                       </div>
                    </div>
                    <div className="flex-1 p-3 bg-opacity-70 flex flex-col justify-end pb-4 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[14.2px] bg-[url('https://i.pinimg.com/736x/85/ec/df/85ecdf1c3611ecc9b7fa85282d9526e0.jpg')] bg-cover">
                       <div className="bg-white text-slate-800 p-2 px-3 shadow-sm w-[85%] self-start rounded-r-xl rounded-bl-xl border border-gray-200 mb-3 ml-1">
                         <p className="whitespace-pre-wrap leading-snug">¡Hola! Soy <b>Kronia</b>. 🤖\n\n¿En qué te puedo ayudar hoy?\n\n1️⃣ Agendar un turno\n2️⃣ Cancelar mi turno\n3️⃣ Ver servicios\n4️⃣ Hablar con un humano</p>
                         <div className="text-[10px] text-slate-400 text-right w-full mt-1">10:45 am</div>
                       </div>
                       <div className="bg-[#dcf8c6] text-slate-800 p-2 px-3 shadow-sm max-w-[80%] self-end rounded-l-xl rounded-br-xl border border-[#c1e2a4] mb-3 mr-1">
                         <p>1</p>
                         <div className="text-[10px] text-slate-500 text-right w-full mt-0.5">10:46 am <span className="text-blue-500">✓✓</span></div>
                       </div>
                       <div className="bg-white text-slate-800 p-2 px-3 shadow-sm w-[85%] self-start rounded-r-xl rounded-bl-xl border border-gray-200 ml-1">
                         <p>Por favor envíame el número del servicio:\n\n1. ✂️ Corte ($5000)\n2. 🧔 Barba ($3000)</p>
                         <div className="text-[10px] text-slate-400 text-right w-full mt-1">10:46 am</div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-900 text-cyan-400 font-black text-xs uppercase tracking-widest mb-6 shadow-[4px_4px_0_0_#ffffff] -rotate-1">
                <MessageSquare size={16} /> Interactivo. 0 IA confusa.
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 text-slate-900 leading-[1.1] tracking-tighter">Dale la bienvenida a Kronia.</h2>
              <p className="text-slate-800 font-medium text-xl mb-8 border-l-4 border-slate-900 pl-4 py-1">
                La gente odia descargar apps. Deja que <b>Kronia</b> tome las reservas por un menú guiado de WhatsApp. Ella atiende 24/7 y se conecta directo con tu calendario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Hub Showcase */}
      <section id="client-hub" className="py-24 bg-white border-b-4 border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16 relative">
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter inline-block relative border-b-8 border-cyan-400 pb-2">Destaca en nuestro Portal</h2>
            <p className="text-slate-600 font-medium text-xl max-w-3xl mx-auto">Al crear tu cuenta en nivel Negocio, tu local aparecerá automáticamente en el mapa y directorio global de clientes explorando.</p>
          </div>

          <div className="bg-slate-100/50 p-6 md:p-10 border-4 border-slate-900 overflow-hidden relative shadow-[12px_12px_0_0_#0f172a]">
             
             {/* Exact ClientHub Matching Mockup */}
             <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                  {[
                    {name: "Barbería Elite", cat: "Barbería", loc: "Palermo"}, 
                    {name: "Estética Bella", cat: "Nails & Spa", loc: "Belgrano"}
                  ].map((b, i) => (
                    <motion.div key={i} whileHover={{ y: -6 }} className="bg-white rounded-[1.2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-[8px_8px_0_0_#2dd4bf] hover:border-slate-900 group flex flex-col h-full relative transition-all duration-300">
                       <div className="relative h-44 overflow-hidden bg-slate-100 border-b-2 border-slate-200 group-hover:border-slate-900 transition-colors">
                         <div className="w-full h-full flex items-center justify-center text-slate-300 bg-yellow-100/20">
                            <Store size={48} className="text-yellow-400" />
                         </div>
                         <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                           <span className="bg-yellow-200 border border-yellow-800 text-yellow-900 text-[11px] font-black tracking-wider px-2 py-0.5 rounded shadow-[1px_1px_0_0_#713f12] uppercase">Nuevo</span>
                         </div>
                         <div className="absolute bottom-3 left-3 bg-white/95 border-2 border-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide shadow-[2px_2px_0_0_#0f172a] uppercase z-10">
                            <MapPin size={12} className="inline text-cyan-600 mr-1" /> {b.loc}
                         </div>
                       </div>
                       <div className="p-5 flex flex-col flex-grow relative bg-white">
                         <h3 className="text-[18px] font-black leading-tight tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors">{b.name}</h3>
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 mb-4">{b.cat}</p>
                         <button className="mt-auto w-full bg-cyan-600 border-2 border-slate-900 text-white text-[13px] font-black py-3 rounded-xl transition-all shadow-[2px_2px_0_0_#0f172a] hover:bg-cyan-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none uppercase tracking-widest">
                            Ver turnos
                         </button>
                       </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Fake Detailed Map */}
                <div className="w-full lg:w-[420px] bg-white rounded-[2rem] shadow-sm border border-slate-200 group hover:border-slate-900 hover:shadow-[10px_10px_0_0_#0f172a] transition-all overflow-hidden h-[450px] relative p-4 flex flex-col">
                   <h3 className="font-black text-lg text-slate-900 mb-3 flex items-center gap-2 px-2"><MapIcon /> Vista en Mapa</h3>
                   <div className="flex-1 rounded-[1.2rem] relative bg-slate-100 border border-slate-200 overflow-hidden">
                     <div className="absolute inset-0 opacity-40 bg-[url('https://maps.wikimedia.org/osm-intl/14/4915/9986.png')] bg-cover bg-center"></div>
                     <div className="absolute left-[40%] top-[40%] text-center">
                        <div className="w-8 h-8 rounded-full border-4 border-white bg-cyan-500 shadow-lg mx-auto transform hover:scale-125 transition-transform duration-300"></div>
                        <div className="bg-white border-2 border-slate-900 px-3 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] mt-2 whitespace-nowrap">
                           <h4 className="font-black text-[14px]">Barbería Elite</h4>
                           <p className="text-[10px] font-black text-slate-500 uppercase">Barbería</p>
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Dynamic */}
      <section id="pricing" className="py-28 bg-[#f0f3fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tighter">Inversión transparente</h2>
              <p className="text-slate-600 text-xl font-medium border-l-4 border-cyan-400 pl-4 py-1">Paga lo justo. Cancela cuando quieras. 7 días gratis en todos.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white border-4 border-slate-900 p-2 shadow-[6px_6px_0_0_#0f172a]">
              <span className={`text-sm font-black uppercase ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}>Mensual</span>
               <button 
                onClick={() => setIsAnnual(!isAnnual)} 
                className={`relative w-14 h-7 border-2 border-slate-900 rounded-none bg-slate-200 transition-colors ${isAnnual ? 'bg-cyan-400' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-slate-900 transition-transform ${isAnnual ? 'translate-x-[26px]' : ''}`}></div>
              </button>
              <div className="flex flex-col items-start -mt-1"><span className={`text-sm font-black uppercase ${isAnnual ? "text-slate-900" : "text-slate-400"}`}>Anual</span><span className="text-[9px] bg-yellow-400 px-1 font-black text-slate-900 leading-none">Ahorras 2 meses</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map(plan => {
               const finalPrice = isAnnual ? plan.price * 10 : plan.price;
               
               return (
                <div key={plan.id} className={`bg-white border-4 border-slate-900 p-8 flex flex-col relative transition-transform duration-300 hover:-translate-y-2 hover:-translate-x-2 ${plan.isPopular ? "shadow-[12px_12px_0_0_#2dd4bf] -mt-4 mb-4" : "shadow-[8px_8px_0_0_#0f172a]"}`}>
                  {plan.isPopular && <div className="absolute -top-5 left-8 border-4 border-slate-900 bg-cyan-400 text-slate-900 font-black text-xs uppercase tracking-widest px-4 py-1.5 shadow-[4px_4px_0_0_#0f172a]">Más Elegido</div>}
                  
                  <h3 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">{plan.name}</h3>
                  <div className="mb-8 pt-6 border-t-4 border-slate-900">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">${finalPrice.toLocaleString('es-AR')}</span>
                    <span className="text-slate-500 font-black uppercase ml-1">/{isAnnual ? 'año' : 'mes'}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={`inc-${i}`} className="flex items-start gap-3">
                        <CheckCircle2 className="text-slate-900 fill-yellow-400 shrink-0 border-none" size={24} /> 
                        <span className="text-slate-800 text-sm font-bold mt-0.5">{f}</span>
                      </li>
                    ))}
                    {plan.missing && plan.missing.map((m, i) => (
                      <li key={`miss-${i}`} className="flex items-start gap-3 opacity-50 grayscale">
                        <X className="text-slate-400 shrink-0" size={24} /> 
                        <span className="text-slate-500 text-sm font-bold line-through mt-0.5">{m}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button onClick={() => navigate(`/pago-suscripcion?plan=${plan.id}&modo=${isAnnual ? 'anual' : 'mensual'}`)} className={brutalistButton + (plan.isPopular ? " bg-slate-900 text-white fill-white hover:bg-slate-800" : " bg-white")}>
                     {plan.price === 10000 ? "Comenzar gratis" : "Pagar suscripción"} <ArrowRight size={18} />
                  </button>
                </div>
               );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-cyan-400 border-t-4 border-slate-900 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
        <div className="relative z-10 w-full max-w-4xl mx-auto bg-white border-4 border-slate-900 p-12 md:p-20 shadow-[16px_16px_0_0_#0f172a] transform -rotate-1">
          <h2 className="text-5xl md:text-6xl lg:text-[72px] font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter uppercase inline-block highlight">¿Estás listo?</h2>
          <p className="text-slate-700 font-medium text-2xl mb-12 border-b-4 border-yellow-400 inline-block pb-2">El salto de calidad que tu local necesita esta a un click.</p>
          <div className="flex justify-center">
            <a href="#pricing" className={brutalistButton + " w-auto px-12 py-5 bg-yellow-400 text-xl font-black shadow-[6px_6px_0_0_#0f172a]"}>
              Ver planes <ArrowRight strokeWidth={3} />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
