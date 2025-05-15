#!/usr/bin/env bash
# exit on error
set -o errexit

# Instala dependências
npm install

# Cria diretório de cache com permissões corretas
PUPPETEER_CACHE_DIR="/opt/render/.cache/puppeteer"
mkdir -p "$PUPPETEER_CACHE_DIR"
chmod -R 755 "$PUPPETEER_CACHE_DIR"

# Instala o Chrome usando o método oficial do Puppeteer
echo "Installing Chrome..."
npx puppeteer browsers install chrome --path="$PUPPETEER_CACHE_DIR"

# Configura permissões
chmod -R 755 "$PUPPETEER_CACHE_DIR"

echo "Chrome installation completed"