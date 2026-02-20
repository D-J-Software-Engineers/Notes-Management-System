FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Ensure the entrypoint script is executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
