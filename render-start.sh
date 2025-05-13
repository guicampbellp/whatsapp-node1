#!/bin/bash

# Verifica a instalação do Chromium
echo "Verificando instalação do Chromium..."
ls -la /usr/bin/chromium
ls -la /usr/bin/chromium-browser
which chromium
which chromium-browser
chromium --version
chromium-browser --version

# Configurações específicas para o Render
#!/bin/bash

# Configurações do Puppeteer
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

# (1) Executa o teste e salva o resultado em um arquivo de log
echo "Executando teste do Chromium..."
node test-chromium.js > chromium-test.log 2>&1

# (2) Mostra o resultado do teste nos logs (opcional)
echo "Resultado do teste:"
cat chromium-test.log

# Instala dependências e inicia o app normalmente
npm install
npm start