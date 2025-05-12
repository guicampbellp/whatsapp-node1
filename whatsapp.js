const fs = require('fs-extra');
const { makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');

// Arquivo de autenticação persistente
const { state, saveState } = useSingleFileAuthState(path.resolve(__dirname, './auth_info.json'));

// Função principal
async function iniciar() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Mostra o QR code no terminal
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão encerrada. Reconectar?', shouldReconnect);
      if (shouldReconnect) iniciar();
    } else if (connection === 'open') {
      console.log('🟢 Conectado ao WhatsApp com sucesso!');
      enviarMensagens(sock);
    }
  });

  sock.ev.on('messages.upsert', m => {
    console.log(JSON.stringify(m, null, 2));
  });
}

// Envia mensagens a partir do JSON
async function enviarMensagens(sock) {
  const arquivo = process.argv[2] || 'mensagem.json';
  if (!fs.existsSync(arquivo)) {
    console.error(`Arquivo ${arquivo} não encontrado!`);
    return;
  }

  const contatos = await fs.readJson(arquivo);
  for (const contato of contatos) {
    if (!contato.telefone || !contato.mensagem) {
      console.warn("Telefone ou mensagem inválida, pulando...");
      continue;
    }

    const numero = contato.telefone.replace(/\D/g, '') + '@s.whatsapp.net';
    try {
      await sock.sendMessage(numero, { text: contato.mensagem });
      console.log(`✅ Mensagem enviada para: ${contato.telefone}`);
    } catch (e) {
      console.error(`❌ Falha ao enviar para ${contato.telefone}:`, e.message);
    }
  }

  console.log('Todas as mensagens foram processadas!');
}

iniciar();
