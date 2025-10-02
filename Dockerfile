FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY scripts/start.sh ./start.sh

RUN mkdir -p /data && chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
