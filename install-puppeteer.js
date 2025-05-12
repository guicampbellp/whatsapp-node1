const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Configurando Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    await browser.close();
    console.log('Puppeteer configurado com sucesso!');
  } catch (err) {
    console.error('Erro na configuração do Puppeteer:', err);
    process.exit(1);
  }
})();