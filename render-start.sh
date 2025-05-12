#!/bin/bash

# Verifica instalação do Chromium
echo "Verificando instalação do Chromium..."
ls -la /usr/bin/chromium
which chromium
chromium --version

# Configurações específicas para o Render
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

# Instala dependências
npm install

# Inicia a aplicação
npm start