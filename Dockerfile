FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY cloudflare/processor ./cloudflare/processor

WORKDIR /app/cloudflare/processor

EXPOSE 10000

CMD ["node", "server.mjs"]
