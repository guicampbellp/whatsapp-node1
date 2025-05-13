const puppeteer = require("puppeteer");
const fs = require("fs-extra");
require("dotenv").config();

(async () => {
  let browser;
  try {
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    const page = await browser.newPage();

    // Configurações avançadas para evitar detecção
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
      timeout: 60000 
    });
    
    console.log("Aguardando QR Code...");
    try {
      await page.waitForSelector("div[role='textbox']", { 
        timeout: 120000 
      });
      console.log("Login confirmado!");
    } catch (err) {
      console.error("Tempo esgotado ao aguardar QR Code. Verifique se:");
      console.error("- Você escaneou o QR Code em até 2 minutos");
      console.error("- A sessão não foi bloqueada pelo WhatsApp");
      throw err;
    }

    for (let contato of contatos) {
      if (!contato.telefone || !contato.mensagem) {
        console.warn("Aviso: Número ou mensagem inválida, pulando...");
        continue;
      }

      const url = `https://web.whatsapp.com/send?phone=${
        contato.telefone
      }&text=${encodeURIComponent(contato.mensagem)}`;
      
      console.log(`Preparando mensagem para: ${contato.telefone}`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      try {
        await page.waitForSelector("div[role='textbox']", { timeout: 20000 });
        const inputBox = await page.$("div[role='textbox']");

        await inputBox.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Enviando mensagem...");
        await page.keyboard.press("Enter");
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Mensagem enviada para: ${contato.telefone}`);
      } catch (err) {
        console.error(`Erro ao enviar mensagem para ${contato.telefone}:`, err.message);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("Processo de envio concluído!");
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();