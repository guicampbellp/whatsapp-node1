#!/bin/bash

# Verifica instalação do Chromium
echo "Verificando instalação do Chromium..."
which chromium-browser || which chromium || which google-chrome
echo "Chromium encontrado em: $(which chromium-browser || which chromium || which google-chrome)"

ls -la /usr/bin/chromium
which chromium
chromium --version
ls -la $PUPPETEER_EXECUTABLE_PATH
# Configurações específicas para o Render
export PUPPETEER_EXECUTABLE_PATH=$(which chromium-browser)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

# Instala dependências
npm install

# Inicia a aplicação
npm start