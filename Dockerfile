# Multi-stage production build for DateFund on Cloud Run / Docker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy application source
COPY . .

# Build production assets for web frontend (dist/)
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend server code and configs
COPY server.ts ./
COPY server ./server
COPY firebase-applet-config.json ./

EXPOSE 8080

CMD ["npm", "start"]
