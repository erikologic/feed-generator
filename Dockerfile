FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn,sharing=locked \
    --mount=type=cache,target=/app/node_modules/.cache,sharing=locked \
    yarn install --frozen-lockfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app ./

COPY . .

RUN --mount=type=cache,target=/app/node_modules/.cache,sharing=locked \
    yarn build

FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn,sharing=locked \
    --mount=type=cache,target=/app/node_modules/.cache,sharing=locked \
    yarn install --frozen-lockfile --production

FROM node:20-alpine

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json yarn.lock ./

RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "dist/index.js"]
