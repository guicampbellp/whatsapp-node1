const { Boom } = require('@hapi/boom');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const qrcode = require('qrcode-terminal');

console.log('Iniciando WhatsApp Baileys...');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: { level: 'warn' }, // Reduz logs para evitar poluição
    browser: ['WhatsApp Node API', 'Chrome', '1.0.0']
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('Escaneie o QR Code abaixo:');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const shouldReconnect = (new Boom(lastDisconnect?.error)).output.statusCode !== DisconnectReason.loggedOut;
      console.log(`Conexão fechada, ${shouldReconnect ? 'reconectando...' : 'faça login novamente.'}`);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('Conectado com sucesso ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  return sock;
}

async function sendMessages(contatos) {
  try {
    const sock = await connectToWhatsApp();
    
    // Aguarda conexão estar pronta
    await new Promise((resolve) => {
      sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') resolve();
      });
    });
    
    console.log(`Preparando para enviar ${contatos.length} mensagens...`);
    
    for (const contato of contatos) {
      if (!contato.telefone || !contato.mensagem) {
        console.warn('Aviso: Número ou mensagem inválida, pulando...');
        continue;
      }
      
      // Formata o número para o padrão internacional (sem +)
      const numero = contato.telefone.replace(/\D/g, '');
      const numeroFormatado = `${numero}@s.whatsapp.net`;
      
      try {
        console.log(`Enviando mensagem para: ${numero}`);
        
        await sock.sendMessage(numeroFormatado, {
          text: contato.mensagem
        });
        
        console.log(`Mensagem enviada para: ${numero}`);
        
        // Intervalo entre mensagens para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Erro ao enviar mensagem para ${numero}:`, err.message);
        continue;
      }
    }
    
    console.log('Processo de envio concluído!');
  } catch (err) {
    console.error('Erro crítico:', err.message);
  }
}

(async () => {
  try {
    const jsonFile = process.argv[2] || 'mensagem.json';
    
    if (!fs.existsSync(jsonFile)) {
      console.error(`Erro: Arquivo ${jsonFile} não encontrado!`);
      return;
    }

    const contatos = await fs.readJson(jsonFile);

    if (!contatos.length) {
      console.error('Erro: Nenhuma mensagem encontrada no arquivo!');
      return;
    }

    await sendMessages(contatos);
  } catch (err) {
    console.error('Erro ao processar arquivo:', err.message);
  }
})();