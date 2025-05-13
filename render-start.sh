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
export PUPPETEER_EXECUTABLE_PATH=$(which chromium || which chromium-browser)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

echo "Usando Chromium em: $PUPPETEER_EXECUTABLE_PATH"

# Instala dependências
npm install

# Inicia a aplicação
npm start