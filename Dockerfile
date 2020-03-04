# Source for pm2: https://benchaplin.hashnode.dev/docker-nodejsexpress-pm2-and-the-12-factor-app-ck0mdst4g000zyys1pvj1islu
FROM node:13.2.0-alpine
WORKDIR /usr/src/app
RUN npm install pm2 -g
COPY package*.json ./
RUN yarn
COPY . .
RUN yarn build
# Erase dev packages
RUN yarn install --production
COPY .dist/ .
CMD ["pm2-runtime", "main.js"]