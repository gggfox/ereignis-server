# syntax=docker/dockerfile:1

FROM node:latest

ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json","package-lock.json","./"]
COPY . .
COPY .env.production .env

RUN npm install --production

EXPOSE 4000

CMD ["node", "dist/index.js"]