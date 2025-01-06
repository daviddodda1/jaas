FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build
WORKDIR /app
EXPOSE 3000 3001
CMD ["sh", "-c", "npm run dev & cd client && npm run dev"]
