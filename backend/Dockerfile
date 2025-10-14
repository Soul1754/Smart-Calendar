# Backend Dockerfile
FROM node:18-bullseye AS builder
WORKDIR /app

# Ensure production build installs reproducibly
COPY package*.json ./
RUN npm ci --only=production --no-audit --prefer-offline || npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 5001

CMD ["npm", "start"]
