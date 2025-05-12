# Usa uma imagem Node.js oficial com versão compatível (18.x)
FROM node:18-slim

# 1. Instala as dependências do sistema necessárias para o Chromium
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
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    # Limpa o cache para reduzir o tamanho da imagem
    && rm -rf /var/lib/apt/lists/*

# 2. Define o diretório de trabalho
WORKDIR /app

# 3. Copia os arquivos de dependência primeiro (otimização de cache Docker)
COPY package.json package-lock.json ./

# 4. Instala as dependências do Node.js
RUN npm install

# 5. Copia todo o código fonte para o container
COPY . .

# 6. Define a variável de ambiente para o caminho do Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 7. Expõe a porta que sua aplicação usa
EXPOSE 3000

# 8. Comando para iniciar a aplicação
CMD ["npm", "start"]