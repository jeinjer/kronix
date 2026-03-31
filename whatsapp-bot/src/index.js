require('dotenv').config();
const { startBot } = require('./bot');
const { startServer } = require('./server');

async function main() {
  console.log("Iniciando WhatsApp Bot...");
  const client = await startBot();
  
  console.log("Iniciando Servidor Express...");
  startServer(client);
}

main().catch(console.error);
