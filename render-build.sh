#!/bin/bash
set -euo pipefail

# Instala o Puppeteer com as dependências necessárias
npm install puppeteer@latest

# Limpa o cache para reduzir o tamanho da build
rm -rf node_modules/puppeteer/.local-chromium