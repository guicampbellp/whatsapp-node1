#!/bin/bash

# 1. Configurações básicas
export NODE_ENV=production

# 2. Instala o Chromium via Puppeteer se não existir
if [ ! -f "/usr/bin/chromium" ]; then
  echo "📦 Chromium não encontrado, instalando via Puppeteer..."
  npx puppeteer install chrome
  ln -s $(find ~/.cache/puppeteer -name chrome -type f | head -n 1) /usr/bin/chromium
fi

# 3. Configura o Puppeteer
export PUPPETEER_EXECUTABLE_PATH=$(which chromium || echo "/usr/bin/chromium")
echo "🔧 Chromium path: $PUPPETEER_EXECUTABLE_PATH"

# 4. Verifica a instalação
ls -la $PUPPETEER_EXECUTABLE_PATH

# 5. Instala dependências
npm install

# 6. Inicia a aplicação
npm start