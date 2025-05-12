const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    console.log('Testando configuração do Puppeteer...');
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    console.log('Puppeteer configurado com sucesso! Versão:', await browser.version());
    await browser.close();
  } catch (err) {
    console.error('Erro na configuração do Puppeteer:', err);
    process.exit(1);
  }
})();