const { Boom } = require('@hapi/boom');
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    makeWALegacySocket,
    Browsers
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto'); // Importação explícita do módulo crypto

// Polyfill para crypto global se necessário
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto;
}

console.log('Iniciando WhatsApp Baileys...');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    
    // Configuração otimizada para o Render
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: {
            level: 'silent', // Reduz ainda mais os logs
            // Implementação mínima do logger para evitar erros
            trace: () => {},
            debug: () => {},
            info: (...args) => console.log('[INFO]', ...args),
            warn: (...args) => console.warn('[WARN]', ...args),
            error: (...args) => console.error('[ERROR]', ...args),
            fatal: (...args) => console.error('[FATAL]', ...args)
        },
        browser: Browsers.ubuntu('Chrome'),
        version: [2, 2413, 1] // Versão estável do WhatsApp Web
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        if (qr) {
            console.log('Escaneie o QR Code abaixo:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (new Boom(lastDisconnect?.error)).output.statusCode !== DisconnectReason.loggedOut;
            console.log(`Conexão fechada, ${shouldReconnect ? 'reconectando em 5s...' : 'faça login novamente.'}`);
            
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('Conectado com sucesso ao WhatsApp!');
            if (isNewLogin) {
                console.log('Nova sessão iniciada!');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    return sock;
}

async function sendMessages(contatos) {
    let sock;
    try {
        sock = await connectToWhatsApp();
        
        // Aguarda conexão com timeout de 2 minutos
        const connectionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout ao aguardar conexão com WhatsApp (120s)'));
            }, 120000);

            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        await connectionPromise;
        
        console.log(`Preparando para enviar ${contatos.length} mensagens...`);
        
        for (const [index, contato] of contatos.entries()) {
            if (!contato.telefone || !contato.mensagem) {
                console.warn(`[${index + 1}/${contatos.length}] Aviso: Número ou mensagem inválida, pulando...`);
                continue;
            }
            
            // Formata o número corretamente
            let numero = contato.telefone.replace(/\D/g, '');
            if (!numero.startsWith('55') && numero.length === 11) {
                numero = '55' + numero; // Adiciona código do Brasil se necessário
            }
            const numeroFormatado = `${numero}@s.whatsapp.net`;
            
            try {
                console.log(`[${index + 1}/${contatos.length}] Enviando mensagem para: ${numero}`);
                
                await sock.sendMessage(numeroFormatado, { 
                    text: contato.mensagem 
                });
                
                console.log(`[${index + 1}/${contatos.length}] Mensagem enviada com sucesso`);
                
                // Intervalo entre mensagens (3-5 segundos)
                const delay = Math.floor(Math.random() * 2000) + 3000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (err) {
                console.error(`[${index + 1}/${contatos.length}] Erro ao enviar:`, err.message);
                // Pausa maior em caso de erro
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }
        }
        
        console.log('Processo de envio concluído com sucesso!');
        return true;
    } catch (err) {
        console.error('Erro crítico no envio:', err.message);
        throw err;
    } finally {
        if (sock) {
            try {
                await sock.end();
                console.log('Conexão encerrada corretamente');
            } catch (e) {
                console.error('Erro ao encerrar conexão:', e.message);
            }
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

        if (!contatos || !Array.isArray(contatos) || contatos.length === 0) {
            console.error('Erro: Nenhuma mensagem válida encontrada no arquivo!');
            process.exit(1);
        }

        console.log(`Iniciando envio de ${contatos.length} mensagens...`);
        const success = await sendMessages(contatos);
        
        process.exit(success ? 0 : 1);
    } catch (err) {
        console.error('Erro no processo principal:', err);
        process.exit(1);
    }
})();