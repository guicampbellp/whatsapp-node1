const { Boom } = require('@hapi/boom');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, default: makeWALegacySocket } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');

console.log('Iniciando WhatsApp Baileys...');

// Solução 1: Usar makeWALegacySocket que é mais estável
// Solução 2: Implementar um logger compatível

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  // Opção 1: Usar makeWALegacySocket (recomendado para maior estabilidade)
  const sock = makeWALegacySocket({
    printQRInTerminal: true,
    auth: state,
    browser: ['WhatsApp Node API', 'Chrome', '1.0.0']
  });

  // Opção 2: Se quiser usar makeWASocket, use este logger compatível
  /*
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: {
      level: 'warn',
      trace: () => {},
      debug: () => {},
      info: (...args) => console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args),
      fatal: (...args) => console.error(...args)
    },
    browser: ['WhatsApp Node API', 'Chrome', '1.0.0']
  });
  */

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
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === 'open') {
      console.log('Conectado com sucesso ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  return sock;
}

async function sendMessages(contatos) {
  let sock;
  try {
    sock = await connectToWhatsApp();
    
    // Aguarda conexão estar pronta com timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao aguardar conexão com WhatsApp'));
      }, 60000);

      sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
    
    console.log(`Preparando para enviar ${contatos.length} mensagens...`);
    
    for (const contato of contatos) {
      if (!contato.telefone || !contato.mensagem) {
        console.warn('Aviso: Número ou mensagem inválida, pulando...');
        continue;
      }
      
      // Formata o número corretamente
      let numero = contato.telefone.replace(/\D/g, '');
      if (!numero.startsWith('55') && numero.length === 11) {
        numero = '55' + numero; // Adiciona código do Brasil se necessário
      }
      const numeroFormatado = `${numero}@s.whatsapp.net`;
      
      try {
        console.log(`Enviando mensagem para: ${numero}`);
        
        await sock.sendMessage(numeroFormatado, { text: contato.mensagem });
        
        console.log(`Mensagem enviada para: ${numero}`);
        
        // Intervalo entre mensagens
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (err) {
        console.error(`Erro ao enviar para ${numero}:`, err.message);
        continue;
      }
    }
    
    console.log('Processo de envio concluído!');
  } catch (err) {
    console.error('Erro crítico:', err.message);
    throw err;
  } finally {
    if (sock) {
      setTimeout(() => {
        sock.end(undefined);
      }, 5000);
    }
  }
}

(async () => {
  try {
    const jsonFile = process.argv[2] || 'mensagem.json';
    
    if (!fs.existsSync(jsonFile)) {
      console.error(`Erro: Arquivo ${jsonFile} não encontrado!`);
      process.exit(1);
    }

    const contatos = await fs.readJson(jsonFile);

    if (!contatos.length) {
      console.error('Erro: Nenhuma mensagem encontrada no arquivo!');
      process.exit(1);
    }

    await sendMessages(contatos);
    process.exit(0);
  } catch (err) {
    console.error('Erro no processo principal:', err.message);
    process.exit(1);
  }
})();