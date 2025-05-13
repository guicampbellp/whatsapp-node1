FROM ghcr.io/puppeteer/puppeteer:24.8.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

    
COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "api.js" ]