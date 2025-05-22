FROM ghcr.io/puppeteer/puppeteer:24.8.2

WORKDIR /usr/src/app

COPY --chown=pptruser:pptruser package*.json ./
RUN npm ci
COPY --chown=pptruser:pptruser . .

# Garante que o usuário pptruser tem permissão em todos os arquivos
RUN chown -R pptruser:pptruser /usr/src/app && \
    chmod -R 755 /usr/src/app

USER pptruser
CMD [ "node", "api.js" ]

