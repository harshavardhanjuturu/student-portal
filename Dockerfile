# Stage 1: Build front-end and back-end
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build Vite frontend assets and bundle Express backend
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package descriptors for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (matched with AI Studio / Cloud Run requirements)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Run the bundled server file
CMD ["node", "dist/server.cjs"]
