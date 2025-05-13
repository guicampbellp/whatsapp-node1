FROM ghcr.io/puppeteer/puppeteer:24.8.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Cria diretório e configura permissões como root
RUN mkdir -p /usr/src/app && \
    chown -R pptruser:pptruser /usr/src/app

WORKDIR /usr/src/app

# Copia os arquivos como root primeiro
COPY package*.json ./

# Instala dependências como root
RUN npm ci

# Muda para pptruser para operações seguintes
USER pptruser

# Copia o restante dos arquivos como pptruser
COPY --chown=pptruser:pptruser . .

# Cria arquivos necessários como pptruser
RUN touch mensagem_selecionados.json && \
    mkdir -p temp

CMD [ "node", "api.js" ]