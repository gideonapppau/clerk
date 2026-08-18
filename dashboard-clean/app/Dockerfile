# syntax = docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS build
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci
COPY . .
ARG GATEWAY_URL
ARG CORE_URL
ARG NEXT_PUBLIC_APP_URL
# Stable across deploys (base64 32-byte AES key). Prevents "Failed to find Server Action" log spam.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV GATEWAY_URL=$GATEWAY_URL
ENV CORE_URL=$CORE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
RUN npm run build
RUN npm prune --omit=dev

FROM base
COPY --from=build /app /app
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
