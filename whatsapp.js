const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();

(async () => {
  let browser;
  try {
    // Carrega os contatos do arquivo
    const contatosPath = path.resolve(process.argv[2] || 'mensagem_selecionados.json');
    console.log(`Carregando contatos de: ${contatosPath}`);
    
    const contatos = await fs.readJson(contatosPath);
    console.log(`Total de contatos a processar: ${contatos.length}`);

    // Configuração do Puppeteer para Docker
    console.log("Iniciando navegador...");
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);

    // Configurações para evitar detecção
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    console.log("Acessando WhatsApp Web...");
    await page.goto("https://web.whatsapp.com", { 
      waitUntil: 'networkidle2',
      timeout: 120000 
    });
    
    console.log("Aguardando QR Code...");
    try {
      await page.waitForSelector("div[role='textbox']", { 
        timeout: 180000 
      });
      console.log("Login confirmado!");
    } catch (err) {
      console.error("Erro ao aguardar login:", err);
      throw new Error("Falha ao fazer login no WhatsApp. Por favor, verifique o QR Code.");
    }

    // Processa cada contato
    for (const [index, contato] of contatos.entries()) {
      try {
        if (!contato.telefone || !contato.mensagem) {
          console.warn(`[${index + 1}/${contatos.length}] Contato inválido, pulando...`);
          continue;
        }

        console.log(`[${index + 1}/${contatos.length}] Preparando mensagem para: ${contato.telefone}`);
        const url = `https://web.whatsapp.com/send?phone=${contato.telefone}&text=${encodeURIComponent(contato.mensagem)}`;
        
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        // Aguarda o campo de mensagem e envia
        await page.waitForSelector("div[role='textbox']", { timeout: 30000 });
        await page.click("div[role='textbox']");
        await page.waitForTimeout(1000);
        
        console.log("Enviando mensagem...");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(3000);
        
        console.log(`Mensagem enviada com sucesso para: ${contato.telefone}`);
      } catch (err) {
        console.error(`Erro ao processar contato ${contato.telefone}:`, err.message);
        // Continua para o próximo contato mesmo em caso de erro
      }
      
      // Intervalo entre mensagens
      await page.waitForTimeout(5000);
    }

    console.log("Processo de envio concluído!");
    process.exit(0);
  } catch (err) {
    console.error("Erro crítico no processo de envio:", err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();