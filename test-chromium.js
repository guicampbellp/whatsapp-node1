const fs = require('fs');

console.log('===== TESTE COMPLETO DO CHROMIUM =====');

// Lista ampliada de possíveis caminhos
const paths = [
  // Caminhos padrão do Linux
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chrome',
  
  // Caminhos do Render
  '/opt/render/.cache/puppeteer/chrome',
  '/opt/render/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome',
  '/opt/render/.cache/puppeteer/chromium',
  
  // Caminhos alternativos
  '/usr/local/bin/chromium',
  '/usr/local/bin/chromium-browser',
  '/snap/bin/chromium',
  
  // Caminhos do Puppeteer
  './node_modules/puppeteer/.local-chromium/chrome'
];

console.log('Procurando Chromium/Chrome nos seguintes locais:');
paths.forEach(path => {
  console.log(`\nVerificando ${path}...`);
  try {
    const exists = fs.existsSync(path);
    console.log(`👉 ${exists ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    if (exists) {
      console.log(`🔍 Tipo: ${fs.lstatSync(path).isDirectory() ? 'Diretório' : 'Arquivo'}`);
      console.log(`🔒 Permissões: ${fs.statSync(path).mode.toString(8)}`);
    }
  } catch (e) {
    console.log(`❌ Erro ao verificar: ${e.message}`);
  }
});

console.log('===== FIM DO TESTE =====');