FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

ADD . .

RUN bun build:vue

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "start"]
