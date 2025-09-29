FROM ghcr.io/puppeteer/puppeteer:19.7.5

USER root

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 8000

CMD ["node", "src/server.js"]