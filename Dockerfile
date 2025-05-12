FROM node:18-slim

# Instala dependências exatas para o Chromium no Render
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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

# Instala dependências específicas para o Render
RUN npm install --production && \
    npm install puppeteer@19.11.1

COPY . .

# Configurações específicas para o Render
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV DISABLE_SETUID_SANDBOX=1
ENV NO_SANDBOX=1

EXPOSE 3000

CMD ["npm", "start"]