FROM node:20-alpine
ENV NODE_ENV development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silence
COPY . .
EXPOSE 8082
CMD npm run serve
