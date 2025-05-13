#!/bin/bash

# Configurações específicas para o Render
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

# Instala dependências
npm install

# Inicia a aplicação
npm start