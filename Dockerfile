# ---- Stage 1: Build Vue UI ----
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY src/vue ./src/vue
RUN cd src/vue && bun run build:vue

# ---- Stage 2: Production ----
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built Vue UI and server code
COPY --from=builder /app/src/vue/dist ./public
COPY src/server ./src/server

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "src/server/index.ts"]
