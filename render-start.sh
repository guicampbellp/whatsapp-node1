#!/bin/bash

# Configura variáveis de ambiente para o Puppeteer no Render
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)

# Instala as dependências
npm install

# Inicia a aplicação
npm start