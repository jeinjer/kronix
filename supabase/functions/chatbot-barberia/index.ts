import { createClient } from "@supabase/supabase-js";

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const BARBERO_ID = 'TU_ID_DE_BARBERO_REAL';
const BARBERIA_ID = 'TU_ID_DE_BARBERIA_REAL';

const userStates: Map<number, { ultimaFechaElegida?: string; ultimaHoraElegida?: string }> = new Map();

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const update = await req.json();
  const message = update.message;
  const callbackQuery = update.callback_query;

  const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
  const data = callbackQuery?.data;
  const text = message?.text;

  // Initialize user state if not exists
  if (!userStates.has(chatId)) {
    userStates.set(chatId, {});
  }
  const userState = userStates.get(chatId)!;

  // --- FUNCIÓN PARA ENVIAR/EDITAR MENSAJES CON BOTONES ---
  const responder = async (texto: string, botones: any = null, messageId: number | null = null) => {
    const method = messageId ? 'editMessageText' : 'sendMessage';
    const body: any = { chat_id: chatId, text: texto, reply_markup: botones ? { inline_keyboard: botones } : null };
    if (messageId) body.message_id = messageId;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  // --- LÓGICA DE NAVEGACIÓN ---
  
  // 1. Menú Principal
  if (text === "/start" || data === "menu_principal") {
    const botones = [
      [{ text: "📅 Agendar Turno", callback_data: "agendar_paso_1" }],
      [{ text: "🔍 Mis Turnos / Cancelar", callback_data: "consultar_turnos" }]
    ];
    await responder("¡Bienvenido a la Barbería! ¿Qué querés hacer?", botones, callbackQuery?.message?.message_id);
  }

  // 2. Selección de Día (Próximos 5 días)
  if (data === "agendar_paso_1") {
    const botones = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const fechaIso = d.toISOString().split('T')[0];
      botones.push([{ text: `📅 ${fechaIso}`, callback_data: `dia_${fechaIso}` }]);
    }
    botones.push([{ text: "⬅️ Volver", callback_data: "menu_principal" }]);
    await responder("Seleccioná el día:", botones, callbackQuery.message.message_id);
  }

  // 3. Selección de Horario (Llamando a tu RPC)
  if (data?.startsWith("dia_")) {
    const fecha = data.split("_")[1];
    userState.ultimaFechaElegida = fecha;
    const { data: horarios } = await supabase.rpc('consultar_disponibilidad', {
      p_barbero_id: BARBERO_ID,
      p_fecha: fecha
    });

    const botones = horarios?.map((h: any) => [
      { text: `⏰ ${h.horario_inicio.slice(0, 5)}`, callback_data: `hora_${fecha}_${h.horario_inicio}` }
    ]) || [];
    
    botones.push([{ text: "⬅️ Cambiar fecha", callback_data: "agendar_paso_1" }]);
    await responder(`Turnos para el ${fecha}:`, botones, callbackQuery.message.message_id);
  }

 // 4. Pedir Teléfono/Contacto después de elegir la hora
if (data?.startsWith("hora_")) {
  const [_, fecha, hora] = data.split("_");
  userState.ultimaFechaElegida = fecha;
  userState.ultimaHoraElegida = hora;
  
  // Usamos un Reply Keyboard (no Inline) para el botón de contacto, es más seguro
  const replyMarkup = {
    keyboard: [[{ text: "📲 Compartir mi número para agendar", request_contact: true }]],
    one_time_keyboard: true,
    resize_keyboard: true
  };

  // Guardamos la intención en el mensaje para que el bot sepa qué fecha/hora eligió
  // Nota: En un bot pro usarías Redis, aquí lo simplificamos pidiendo el contacto.
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: `Excelente elección para el ${fecha} a las ${hora.slice(0, 5)}. Para finalizar, necesito tu número de contacto:`,
      reply_markup: replyMarkup 
    }),
  });
  
  // Tip de QA: Guardamos temporalmente la fecha/hora en una variable o contexto si fuera necesario
  // Para este prototipo, asumiremos que el siguiente mensaje con contacto completa el último turno iniciado.
}

// 5. Recibir el Contacto e Insertar en la DB
if (message?.contact) {
  const telefono = message.contact.phone_number;
  const nombre = message.contact.first_name;

  // Aquí insertarías el turno con el teléfono REAL
  const { error } = await supabase.from('turnos').insert({
    barberia_id: BARBERIA_ID,
    barbero_id: BARBERO_ID,
    cliente_nombre: nombre,
    cliente_telefono: telefono, // <--- Ahora sí tenemos el dato para cancelar luego
    inicio_turno: `${userState.ultimaFechaElegida}T${userState.ultimaHoraElegida}`, // Deberás manejar este estado
    estado: 'confirmado'
  });

  await responder("¡Turno confirmado! ✅ Ya podés verlo en 'Mis Turnos' usando tu número.", [[{ text: "🏠 Inicio", callback_data: "menu_principal" }]]);
}

  // --- 6. Consultar Turnos (Pedir teléfono) ---
if (data === "consultar_turnos") {
  await responder("Por favor, escribí tu número de teléfono para buscar tus turnos (solo números, ej: 3541667788):");
}

// --- 7. Procesar el teléfono y Listar Turnos ---
// Si entra un mensaje de texto que parece un teléfono (y no es un comando)
if (text && /^\d+$/.test(text) && !data) {
  const { data: misTurnos, error } = await supabase
    .from('turnos')
    .select('id, inicio_turno, estado')
    .eq('cliente_telefono', text)
    .eq('estado', 'confirmado') // Solo mostramos los que puede cancelar
    .gte('inicio_turno', new Date().toISOString()) // Solo turnos futuros
    .order('inicio_turno', { ascending: true });

  if (!misTurnos || misTurnos.length === 0) {
    await responder("No encontré turnos confirmados para ese número.", [[{ text: "⬅️ Volver", callback_data: "menu_principal" }]]);
  } else {
    const botones = misTurnos.map(t => {
      const fecha = new Date(t.inicio_turno).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return [{ text: `❌ Cancelar: ${fecha}`, callback_data: `cancelar_id_${t.id}` }];
    });
    botones.push([{ text: "🏠 Volver al inicio", callback_data: "menu_principal" }]);
    
    await responder(`Encontré estos turnos para el número ${text}. Tocá uno para cancelarlo:`, botones);
  }
}

// --- 8. Ejecutar Cancelación ---
if (data?.startsWith("cancelar_id_")) {
  const turnoId = data.split("_")[2];

  const { error } = await supabase
    .from('turnos')
    .update({ estado: 'cancelado' })
    .eq('id', turnoId);

  const mensajeFin = error 
    ? "No se pudo cancelar el turno. Intentá más tarde." 
    : "✅ El turno ha sido cancelado con éxito.";

  await responder(mensajeFin, [[{ text: "🏠 Inicio", callback_data: "menu_principal" }]], callbackQuery.message.message_id);
}

  return new Response("ok");
});