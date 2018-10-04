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
EXPOSE 5000
CMD ["npm", "start"]