const fs = require('fs');

console.log('Verificando instalação do Chromium...');

const paths = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chrome'
];

paths.forEach(path => {
  console.log(`Verificando ${path}...`);
  try {
    const exists = fs.existsSync(path);
    console.log(`${path} ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
    if (exists) {
      console.log(`Permissões: ${fs.statSync(path).mode.toString(8)}`);
    }
  } catch (e) {
    console.log(`Erro ao verificar ${path}: ${e.message}`);
  }
});

console.log('Processo concluído');