# create a file named Dockerfile
FROM node:9.1-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
WORKDIR /app/client
RUN npm install
RUN npm run build
WORKDIR /app
RUN npm install -g pm2
EXPOSE 5000
CMD pm2 start --no-daemon  processes.json