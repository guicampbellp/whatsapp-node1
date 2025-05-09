#!/bin/bash

# Configura variáveis de ambiente para o Puppeteer no Render
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
export RENDER=true

# Instala as dependências
npm install

# Inicia a aplicação
npm start