FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CHOKIDAR_USEPOLLING=true
ENV HOST=0.0.0.0

EXPOSE 3000
CMD ["npm", "start"]
