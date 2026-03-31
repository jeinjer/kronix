const express = require('express');
const { processMessage } = require('./bot');

function startServer(whatsappClient) {
  const app = express();
  app.use(express.json());

  // Webhook desde Supabase para enviar notificaciones de cancelación u otros
  // Se configura la URL en Supabase Dashboard (Database -> Webhooks)
  app.post('/webhook/supabase', async (req, res) => {
    try {
      const payload = req.body;
      console.log('Recibido webhook Supabase:', payload);

      // Si se borra un turno o cambia de estado
      if (payload.type === 'DELETE' || (payload.type === 'UPDATE' && payload.record.status === 'cancelled')) {
        const record = payload.type === 'DELETE' ? payload.old_record : payload.record;
        
        // Supongamos que el cliente tiene el teléfono en client_phone o existe client_id
        const phone = record.client_phone || '5491100000000'; // de prueba
        // whatsapp-web.js requiere que el numero termine en @c.us
        const chatId = phone.includes('@c.us') ? phone : `${phone.replace(/\+/g, '')}@c.us`;

        const mensaje = `Hola. Te informamos que tu turno del día ${record.date} a las ${record.start_time} ha sido cancelado.`;
        await whatsappClient.sendMessage(chatId, mensaje);
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  });

  // Endpoin de Custom SMS Provider para enviar Magic Link
  app.post('/webhook/sms', async (req, res) => {
    try {
      // Formato recibido de Supabase dependiendo de la config
      const payload = req.body;
      console.log('Recibido OTP hook:', payload);

      const phoneNum = payload.user?.phone || payload.phone;
      const otp = payload.sms?.otp || payload.otp;

      if (phoneNum && otp) {
        const chatId = phoneNum.includes('@c.us') ? phoneNum : `${phoneNum.replace(/\+/g, '')}@c.us`;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Construimos el magic link que luego será consumido por React con supabase.auth.verifyOtp
        const magicLink = `${frontendUrl}/wa-verify?phone=${encodeURIComponent(phoneNum)}&otp=${encodeURIComponent(otp)}`;

        const mensaje = `🔐 Solicitaste iniciar sesión.\nHaz clic en el siguiente enlace para entrar mágicamente a la App:\n\n${magicLink}\n\nO utiliza este código manualmente: ${otp}`;
        
        await whatsappClient.sendMessage(chatId, mensaje);
      }

      res.status(200).send('SMS sent');
    } catch (err) {
      console.error('Error enviando magic link:', err);
      res.status(500).send('Internal Error');
    }
  });

  // Endpoint de pruebas locales para simular mensajes entrantes sin WhatsApp real
  app.post('/test/message', async (req, res) => {
    try {
      const { phone = '1122334455@c.us', text } = req.body;
      
      console.log(`\n[TEST] Simulando mensaje de ${phone}: "${text}"`);
      
      let replyContenido = '';
      
      // Llamamos a la lógica desacoplada y capturamos la "respuesta"
      await processMessage(phone, text, (to, replyText) => {
        replyContenido = replyText;
        console.log(`\n==========================================\n[BOT RESPUESTA a ${to}]:\n${replyText}\n==========================================\n`);
      });

      res.status(200).json({ success: true, fakeReply: replyContenido });
    } catch (err) {
      console.error('Error en el test:', err);
      res.status(500).send('Error in Test');
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express server escuchando en el puerto ${port}`);
  });
}

module.exports = { startServer };
