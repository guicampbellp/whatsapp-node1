FROM node:18-slim

# 1. Instala o Chromium diretamente dos repositórios Debian
RUN apt-get update && \
    apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# 2. Cria diretório de cache do Puppeteer
RUN mkdir -p /opt/render/.cache/puppeteer && \
    chmod -R 777 /opt/render/.cache

WORKDIR /app

COPY package.json package-lock.json ./

# 3. Instala dependências (ignorando download do Chromium)
RUN PUPPETEER_SKIP_DOWNLOAD=true npm install

COPY . .

# 4. Configurações de ambiente
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]