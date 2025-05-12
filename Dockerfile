FROM node:18-slim

# 1. Instala apenas as dependências do sistema necessárias
RUN apt-get update && \
    apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# 2. Define o diretório de trabalho
WORKDIR /app

# 3. Copia os arquivos de dependência primeiro
COPY package.json package-lock.json ./

# 4. Instala as dependências do Node.js (SEM instalação automática do Chromium)
RUN npm install --production --ignore-scripts

# 5. Copia todo o código fonte
COPY . .

# 6. Configurações de ambiente
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV DISABLE_SETUID_SANDBOX=1
ENV NO_SANDBOX=1

# 7. Porta da aplicação
EXPOSE 3000

# 8. Comando de inicialização
CMD ["npm", "start"]