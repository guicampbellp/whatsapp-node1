const puppeteer = require("puppeteer");
const fs = require("fs-extra");

(async () => {
  let browser;
  try {
    const jsonFile = process.argv[2] || "mensagem.json";
    
    if (!fs.existsSync(jsonFile)) {
      console.error(`Erro: Arquivo ${jsonFile} não encontrado!`);
      return;
    }

    const contatos = await fs.readJson(jsonFile);

    if (!contatos.length) {
      console.error("Erro: Nenhuma mensagem encontrada no arquivo!");
      return;
    }

    // Configurações melhoradas para lançamento do navegador
    browser = await puppeteer.launch({
      headless: false,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      userDataDir: "./user_data",
      ignoreDefaultArgs: ["--enable-automation"],
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

    await page.goto("https://web.whatsapp.com");
    console.log("Escaneie o QR Code no WhatsApp Web!");

    await page.waitForSelector("div[role='textbox']", { timeout: 120000 });
    console.log("Login confirmado!");

    for (let contato of contatos) {
      if (!contato.telefone || !contato.mensagem) {
        console.warn("Aviso: Número ou mensagem inválida, pulando...");
        continue;
      }

      const url = `https://web.whatsapp.com/send?phone=${
        contato.telefone
      }&text=${encodeURIComponent(contato.mensagem)}`;
      await page.goto(url);

      try {
        await page.waitForSelector("div[role='textbox']", { timeout: 20000 });
        const inputBox = await page.$("div[role='textbox']");

        // Simula um clique no campo de texto para garantir o foco
        await inputBox.click();

        // Substituição do waitForTimeout
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simula a tecla "Enter" para enviar a mensagem
        await page.keyboard.press("Enter");

        // Espera entre mensagens
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Mensagem enviada para: ${contato.telefone}`);
      } catch (err) {
        console.error(`Erro ao enviar mensagem para ${contato.telefone}:`, err);
      }

      // Espera entre contatos
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("Todas as mensagens foram enviadas!");
  } catch (err) {
    console.error("Erro crítico:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();