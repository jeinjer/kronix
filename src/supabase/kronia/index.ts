import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Edge Function (Deno) - Bot de Telegram (Prototipo)
 * Requiere variables de entorno:
 * - TELEGRAM_BOT_TOKEN
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DEFAULT_ORG_ID (uuid)
 * - DEFAULT_STAFF_ID (uuid)
 * Opcionales:
 * - DEFAULT_TZ_OFFSET (ej: -03:00)
 * - SLOT_MINUTES (ej: 30)
 */

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const ORG_ID = Deno.env.get("DEFAULT_ORG_ID");
const STAFF_ID = Deno.env.get("DEFAULT_STAFF_ID");

const TZ_OFFSET = Deno.env.get("DEFAULT_TZ_OFFSET") ?? "-03:00";
const SLOT_MINUTES = Number(Deno.env.get("SLOT_MINUTES") ?? "30");

type UserState = {
  ultimaFechaElegida?: string;
  ultimaHoraElegida?: string;
  ultimoTelefonoBuscado?: string;
};

const userStates: Map<number, UserState> = new Map();

const addDaysStr = (dateStr: string, days: number) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toTs = (dateStr: string, timeHHMM: string) => `${dateStr}T${timeHHMM}:00${TZ_OFFSET}`;

const rangeForDate = (dateStr: string) => {
  const start = `${dateStr}T00:00:00${TZ_OFFSET}`;
  const next = `${addDaysStr(dateStr, 1)}T00:00:00${TZ_OFFSET}`;
  return { start, next };
};

const minutesFromHHMM = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const hhmmFromMinutes = (mins: number) => {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

async function responder(
  chatId: number,
  texto: string,
  botones: any = null,
  messageId: number | null = null,
) {
  const method = messageId ? "editMessageText" : "sendMessage";
  const body: any = {
    chat_id: chatId,
    text: texto,
    reply_markup: botones ? { inline_keyboard: botones } : undefined,
  };
  if (messageId) body.message_id = messageId;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function buildSlotsForDay(supabase: any, dateStr: string) {
  if (!ORG_ID || !STAFF_ID) return [];

  const dow = new Date(`${dateStr}T00:00:00${TZ_OFFSET}`).getDay(); // 0-6

  const { data: schedules, error: schErr } = await supabase
    .from("staff_schedules")
    .select("start_time,end_time,is_break")
    .eq("staff_id", STAFF_ID)
    .eq("day_of_week", dow);

  if (schErr) throw schErr;

  const availability = (schedules || []).filter((s: any) => !s.is_break);
  const breaks = (schedules || []).filter((s: any) => s.is_break);

  // Si no hay horarios definidos, no hay slots
  if (availability.length === 0) return [];

  // Turnos ya reservados ese día
  const { start, next } = rangeForDate(dateStr);
  const { data: appts, error: apptErr } = await supabase
    .from("appointments")
    .select("start_time,end_time,status")
    .eq("staff_id", STAFF_ID)
    .neq("status", "canceled")
    .gte("start_time", start)
    .lt("start_time", next);

  if (apptErr) throw apptErr;

  const taken = (appts || []).map((a: any) => ({
    start: new Date(a.start_time),
    end: new Date(a.end_time),
  }));

  // Generar slots por ventanas de disponibilidad (step SLOT_MINUTES) y excluir breaks y colisiones
  const slots: string[] = [];

  for (const w of availability) {
    const wStart = minutesFromHHMM(String(w.start_time).slice(0, 5));
    const wEnd = minutesFromHHMM(String(w.end_time).slice(0, 5));

    for (let t = wStart; t + SLOT_MINUTES <= wEnd; t += SLOT_MINUTES) {
      const slotStartHHMM = hhmmFromMinutes(t);
      const slotEndHHMM = hhmmFromMinutes(t + SLOT_MINUTES);

      // Excluir si cae en un break
      const inBreak = breaks.some((b: any) => {
        const bStart = minutesFromHHMM(String(b.start_time).slice(0, 5));
        const bEnd = minutesFromHHMM(String(b.end_time).slice(0, 5));
        return t < bEnd && (t + SLOT_MINUTES) > bStart;
      });
      if (inBreak) continue;

      const slotStart = new Date(toTs(dateStr, slotStartHHMM));
      const slotEnd = new Date(toTs(dateStr, slotEndHHMM));

      const collides = taken.some((x) => overlaps(slotStart, slotEnd, x.start, x.end));
      if (collides) continue;

      // Excluir slots pasados (hoy)
      if (slotStart.getTime() < Date.now()) continue;

      slots.push(slotStartHHMM);
    }
  }

  return slots.slice(0, 20); // límite de botones
}

Deno.serve(async (req) => {
  if (!TELEGRAM_TOKEN) return new Response("Missing TELEGRAM_BOT_TOKEN", { status: 500 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const update = await req.json();
  const message = update.message;
  const callbackQuery = update.callback_query;

  const chatId: number | undefined = message?.chat?.id || callbackQuery?.message?.chat?.id;
  if (!chatId) return new Response("ok");

  const data: string | undefined = callbackQuery?.data;
  const text: string | undefined = message?.text;

  if (!userStates.has(chatId)) userStates.set(chatId, {});
  const userState = userStates.get(chatId)!;

  // 1) Menú principal
  if (text === "/start" || data === "menu_principal") {
    const botones = [
      [{ text: "Agendar turno", callback_data: "agendar_paso_1" }],
      [{ text: "Mis turnos / Cancelar", callback_data: "consultar_turnos" }],
    ];
    await responder(chatId, "¿Qué querés hacer?", botones, callbackQuery?.message?.message_id ?? null);
    return new Response("ok");
  }

  // 2) Selección de día (próximos 5 días)
  if (data === "agendar_paso_1") {
    const botones = [];
    for (let i = 0; i < 5; i++) {
      const today = new Date();
      today.setDate(today.getDate() + i);
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const fechaIso = `${yyyy}-${mm}-${dd}`;
      botones.push([{ text: fechaIso, callback_data: `dia_${fechaIso}` }]);
    }
    botones.push([{ text: "Volver", callback_data: "menu_principal" }]);
    await responder(chatId, "Seleccioná el día:", botones, callbackQuery?.message?.message_id ?? null);
    return new Response("ok");
  }

  // 3) Selección de hora (slots calculados desde staff_schedules y appointments)
  if (data?.startsWith("dia_")) {
    const fecha = data.split("_")[1];
    userState.ultimaFechaElegida = fecha;

    let slots: string[] = [];
    try {
      slots = await buildSlotsForDay(supabase, fecha);
    } catch (e) {
      console.error(e);
      await responder(chatId, "No pude consultar disponibilidad. Intentá más tarde.", [
        [{ text: "Volver", callback_data: "menu_principal" }],
      ], callbackQuery?.message?.message_id ?? null);
      return new Response("ok");
    }

    if (slots.length === 0) {
      await responder(chatId, `Sin horarios disponibles para ${fecha}.`, [
        [{ text: "Cambiar fecha", callback_data: "agendar_paso_1" }],
        [{ text: "Volver", callback_data: "menu_principal" }],
      ], callbackQuery?.message?.message_id ?? null);
      return new Response("ok");
    }

    const botones = slots.map((hhmm) => [{ text: hhmm, callback_data: `hora_${fecha}_${hhmm}` }]);
    botones.push([{ text: "Cambiar fecha", callback_data: "agendar_paso_1" }]);
    await responder(chatId, `Horarios para ${fecha}:`, botones, callbackQuery?.message?.message_id ?? null);
    return new Response("ok");
  }

  // 4) Pedir contacto después de elegir la hora
  if (data?.startsWith("hora_")) {
    const [, fecha, hhmm] = data.split("_");
    userState.ultimaFechaElegida = fecha;
    userState.ultimaHoraElegida = hhmm;

    const replyMarkup = {
      keyboard: [[{ text: "Compartir mi número para agendar", request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    };

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Turno: ${fecha} ${hhmm}. Para finalizar, compartí tu número:`,
        reply_markup: replyMarkup,
      }),
    });

    return new Response("ok");
  }

  // 5) Recibir contacto e insertar appointment (RPC create_appointment)
  if (message?.contact) {
    if (!ORG_ID || !STAFF_ID) {
      await responder(chatId, "Falta configuración del bot (ORG/STAFF).", [
        [{ text: "Volver", callback_data: "menu_principal" }],
      ]);
      return new Response("ok");
    }

    const telefono = message.contact.phone_number;
    const nombre = message.contact.first_name || "Cliente";

    const fecha = userState.ultimaFechaElegida;
    const hhmm = userState.ultimaHoraElegida;

    if (!fecha || !hhmm) {
      await responder(chatId, "No tengo fecha/hora seleccionada. Volvé a agendar.", [
        [{ text: "Agendar", callback_data: "agendar_paso_1" }],
      ]);
      return new Response("ok");
    }

    const startTime = toTs(fecha, hhmm);
    const endTime = toTs(fecha, hhmmFromMinutes(minutesFromHHMM(hhmm) + SLOT_MINUTES));

    const { data: result, error } = await supabase.rpc("create_appointment", {
      p_org_id: ORG_ID,
      p_staff_id: STAFF_ID,
      p_client_name: nombre,
      p_client_phone: telefono,
      p_start_time: startTime,
      p_end_time: endTime,
      p_notes: null,
    });

    if (error || !result?.success) {
      console.error(error || result);
      await responder(chatId, String(result?.message ?? "No se pudo reservar el turno."), [
        [{ text: "Volver", callback_data: "menu_principal" }],
      ]);
      return new Response("ok");
    }

    await responder(chatId, "Turno reservado con éxito.", [[{ text: "Inicio", callback_data: "menu_principal" }]]);
    return new Response("ok");
  }

  // 6) Consultar turnos (pedir teléfono)
  if (data === "consultar_turnos") {
    await responder(chatId, "Escribí tu número de teléfono para buscar tus turnos (solo números).");
    return new Response("ok");
  }

  // 7) Procesar teléfono y listar turnos futuros (no cancelados)
  if (text && /^\d+$/.test(text) && !data) {
    userState.ultimoTelefonoBuscado = text;

    const { data: misTurnos, error } = await supabase
      .from("appointments")
      .select("id,start_time,status")
      .eq("client_phone", text)
      .neq("status", "canceled")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      await responder(chatId, "No pude buscar tus turnos. Intentá más tarde.", [
        [{ text: "Inicio", callback_data: "menu_principal" }],
      ]);
      return new Response("ok");
    }

    if (!misTurnos || misTurnos.length === 0) {
      await responder(chatId, "No encontré turnos futuros con ese número.", [
        [{ text: "Inicio", callback_data: "menu_principal" }],
      ]);
      return new Response("ok");
    }

    const botones = misTurnos.map((t: any) => {
      const fecha = new Date(t.start_time).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      return [{ text: `Cancelar: ${fecha}`, callback_data: `cancelar_id_${t.id}` }];
    });

    botones.push([{ text: "Inicio", callback_data: "menu_principal" }]);
    await responder(chatId, `Encontré estos turnos para ${text}:`, botones);
    return new Response("ok");
  }

  // 8) Cancelar turno (status = canceled)
  if (data?.startsWith("cancelar_id_")) {
    const appointmentId = data.split("_")[2];

    const { error } = await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("id", appointmentId);

    const mensajeFin = error
      ? "No se pudo cancelar el turno. Intentá más tarde."
      : "El turno fue cancelado.";

    await responder(chatId, mensajeFin, [[{ text: "Inicio", callback_data: "menu_principal" }]], callbackQuery?.message?.message_id ?? null);
    return new Response("ok");
  }

  return new Response("ok");
});
