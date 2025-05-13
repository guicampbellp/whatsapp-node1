#!/bin/bash

# Caminhos prioritários para testar
PRIORITY_PATHS=(
  "/opt/render/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome"
  "/opt/render/.cache/puppeteer/chrome"
  "/usr/bin/chromium"
  "/usr/bin/google-chrome-stable"
)

# Tenta encontrar o executável
CHROMIUM_PATH=""
for path in "${PRIORITY_PATHS[@]}"; do
  if [ -f "$path" ] && [ -x "$path" ]; then
    CHROMIUM_PATH="$path"
    break
  fi
done

# Configurações do Puppeteer
export PUPPETEER_EXECUTABLE_PATH=${CHROMIUM_PATH:-'/usr/bin/chromium'}
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_ENV=production

echo "⚙️ Configuração do Puppeteer:"
echo "   🎯 Caminho do Chromium: $PUPPETEER_EXECUTABLE_PATH"

# Verifica se o arquivo existe e é executável
if [ ! -f "$PUPPETEER_EXECUTABLE_PATH" ]; then
  echo "❌ ERRO: Chromium não encontrado no caminho especificado!"
  echo "   Executando busca completa..."
  find / -name "chrome" -o -name "chromium" -type f -executable 2>/dev/null | while read -r found_path; do
    echo "   🔍 Possível candidato: $found_path"
  done
  exit 1
fi

# Mostra informações do executável
echo "ℹ️ Informações do Chromium:"
ls -la "$PUPPETEER_EXECUTABLE_PATH"
file "$PUPPETEER_EXECUTABLE_PATH"

# Instala dependências
npm install

# Executa o teste
node test-chromium.js

# Inicia a aplicação
npm start