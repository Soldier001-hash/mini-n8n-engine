# VERSÃO CORRETA E COMPLETA DO DOCKERFILE

# Passo 1: Comece com um ambiente que JÁ TEM Node.js e npm na versão 18.
FROM node:18-slim

# Passo 2: Crie e defina uma pasta de trabalho dentro do ambiente.
WORKDIR /app

# Passo 3: Copie os arquivos de configuração de dependências.
COPY package*.json ./

# Passo 4: Rode "npm install" DENTRO do ambiente para instalar as dependências.
RUN npm install

# Passo 5: Copie TODO o resto do seu código (nodes, core, etc.) para a pasta.
COPY . .
# Passo 6: Defina o comando que será executado para iniciar a aplicação.
CMD ["npm", "start"]

