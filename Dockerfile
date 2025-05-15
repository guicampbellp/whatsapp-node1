FROM ghcr.io/puppeteer/puppeteer:24.8.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Instala dependências adicionais necessárias para pdf-parse
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

# Cria diretório para arquivos temporários e garante permissões
RUN mkdir -p /usr/src/app/temp && \
    chown -R pptruser:pptruser /usr/src/app

USER pptruser

CMD [ "node", "api.js" ]