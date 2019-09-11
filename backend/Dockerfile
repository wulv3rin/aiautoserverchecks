FROM node:12.9-alpine
ENV NODE_ENV development
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json", "./"]
RUN npm install --silence
RUN npm i -g nodemon
RUN mv node_modules/ ../ 
COPY . .
EXPOSE 3000
CMD nodemon main.js
