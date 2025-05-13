FROM ghcr.io/puppeteer/puppeteer:24.8.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

# Copia todos os arquivos necessários
COPY . .

# Garante as permissões corretas
RUN mkdir -p /usr/src/app/temp && \
    touch /usr/src/app/mensagem_selecionados.json && \
    chown -R pptruser:pptruser /usr/src/app && \
    chmod -R 755 /usr/src/app

USER pptruser

CMD [ "node", "api.js" ]