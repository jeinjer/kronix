const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const supabase = require('./supabase');

async function startBot() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
  });

  client.on('qr', (qr) => {
    console.log('Escanea este QR con tu celular:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('¡Bot de WhatsApp listo!');
  });

  client.on('message', async (msg) => {
    if (msg.from === 'status@broadcast') return;
    
    const phone = msg.from; // formato: 5491100000000@c.us
    const text = msg.body.trim();

    await processMessage(phone, text, (to, replyText) => {
       return client.sendMessage(to, replyText);
    });
  });

  client.initialize();
  
  return client;
}

// Función extraída para poder testear la lógica sin WhatsApp real
async function processMessage(phone, text, sendMessage) {
  try {
    // Detectar si el usuario inicia con un código de negocio
    const negocioMatch = text.match(/#([a-f0-9\-]+)/i);

      if (negocioMatch) {
        const organizationId = negocioMatch[1];
        
        // Verificar si la org existe (opcional)
        const { data: org } = await supabase.from('organizations').select('id, name').eq('id', organizationId).single();
        if(!org) {
          return sendMessage(phone, "No encontré ese negocio. Verifica el enlace.");
        }

        // Crear o resetear sesión
        await supabase.from('bot_sessions').upsert({
          phone_number: phone,
          organization_id: organizationId,
          state: 'GREETING',
          context: {}
        });

        const greeting = `¡Hola! Bienvenido a ${org.name}.\nPor favor, responde con el *número* del servicio que deseas:\n\n1. Corte de pelo\n2. Barba\n3. Completo`;
        return sendMessage(phone, greeting);
      }

      // Buscar sesión activa
      const { data: session } = await supabase.from('bot_sessions').select('*').eq('phone_number', phone).single();

      if (!session) {
        // No hay sesión activa y no envió ID
        // client.sendMessage(phone, "Hola. Si quieres agendar un turno, por favor usa el link de tu barbería.");
        return;
      }

      // Máquina de estados (FSM)
      const { state, context, organization_id } = session;

      if (state === 'GREETING') {
        const selected = parseInt(text);
        if ([1, 2, 3].includes(selected)) {
          // Guardar servicio elegido (simulado por el ID)
          context.service_id = selected;
          await supabase.from('bot_sessions').update({ state: 'AWAITING_STAFF', context }).eq('phone_number', phone);
          
          return sendMessage(phone, `¡Perfecto! Ahora elige el profesional:\n\n1. Juan\n2. Pedro\n3. Cualquiera`);
        } else {
          return sendMessage(phone, "Por favor responde con 1, 2 o 3.");
        }
      }

      if (state === 'AWAITING_STAFF') {
        const selected = parseInt(text);
        if ([1, 2, 3].includes(selected)) {
          context.staff_id = selected;
          await supabase.from('bot_sessions').update({ state: 'AWAITING_DATE', context }).eq('phone_number', phone);
          
          return sendMessage(phone, `¡Bien! Escribe la fecha en la que deseas venir (ej. Hoy, Mañana, 25/12)`);
        } else {
          return sendMessage(phone, "Por favor responde con 1 o 2.");
        }
      }

      if (state === 'AWAITING_DATE') {
        context.date = text;
        await supabase.from('bot_sessions').update({ state: 'AWAITING_TIME', context }).eq('phone_number', phone);
          
        return sendMessage(phone, `Para el ${text}, tenemos estos horarios:\n\n1. 10:00 AM\n2. 11:00 AM\n3. 02:00 PM\n4. 04:00 PM\nElige el número de tu preferencia.`);
      }

      if (state === 'AWAITING_TIME') {
        const selected = parseInt(text);
        if (selected >= 1 && selected <= 4) {
          const horarios = ["10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];
          context.time = horarios[selected - 1];
          await supabase.from('bot_sessions').update({ state: 'CONFIRMING', context }).eq('phone_number', phone);
          
          return sendMessage(phone, `¿Confirmas el turno para el ${context.date} a las ${context.time}?\nResponde *SI* para confirmar o *NO* para cancelar.`);
        }
      }

      if (state === 'CONFIRMING') {
        if (text.toUpperCase() === 'SI') {
          // ACA SE INSERTARIA EL TURNO EN SUPABASE REALMENTE
          // ... call check_appointment_overlap or insert directly
          await supabase.from('bot_sessions').delete().eq('phone_number', phone);
          return sendMessage(phone, `✅ Tu turno para el ${context.date} a las ${context.time} ha sido registrado exitosamente. ¡Te esperamos!`);
        } else {
          await supabase.from('bot_sessions').delete().eq('phone_number', phone);
          return sendMessage(phone, "❌ Turno cancelado. Puedes volver a escribirme cuando lo desees.");
        }
      }

    } catch (err) {
      console.error('Error en manejador de mensajes:', err);
    }
}

module.exports = { startBot, processMessage };
