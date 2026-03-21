FROM node:20-bookworm

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
RUN npm i -g serve
COPY . .
RUN npm run build
EXPOSE 3000

CMD [ "serve", "-s", "dist" ]