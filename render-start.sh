#!/bin/bash

# Configurações específicas para o Render
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

# Instala dependências
npm install

# Mostra informações importantes
echo "=== Ambiente ==="
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Puppeteer: $(npm list puppeteer)"
echo "Chromium path: $PUPPETEER_EXECUTABLE_PATH"

# Executa o teste do Chromium (já chamado pelo prestart)
# Inicia a aplicação
npm start