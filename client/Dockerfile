# =============================================================================
# Dockerfile — React Client (Multi-Stage: Node Build → Nginx)
# =============================================================================
# Stage 1: Build the React app with Vite
# Stage 2: Serve static files with Nginx (production-optimized)
# =============================================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS runtime

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
