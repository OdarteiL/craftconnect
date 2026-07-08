# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
