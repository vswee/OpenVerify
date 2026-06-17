# OpenVerify

OpenVerify is a Trinidad and Tobago-focused identity verification MVP built around a Cloudflare Worker API, Supabase persistence, and a Docker-based processing service on Render.

## Cloudflare app

- Frontend and API domain: `https://openverify.flat18.app`
- Deployment target: Cloudflare Workers with static assets
- Cloudflare config: [`wrangler.jsonc`](/Users/edsin/Workspace/APP/Flat18/OpenVerify/wrangler.jsonc)

## Current live processor

- Render processor: `https://openverify.onrender.com`
- Health check: `GET /health`
- Analysis endpoint: `POST /analyze`

## Required configuration

### Worker environment

Set these values on the Cloudflare Worker:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional, if you want the worker to call the Render processor instead of using local analysis:
  - `PROCESSOR_URL=https://openverify.onrender.com`
  - `PROCESSOR_TOKEN=<same secret used on Render>`

### Render service

The Render service must have `PROCESSOR_TOKEN` set as a secret environment variable. Without it, `/health` will still work but `/analyze` will return `401`.

### Cloudflare deploy

Use the repo script to build and deploy the Worker plus SPA:

```bash
npm run deploy:cloudflare
```

That deploy uses the `openverify.flat18.app` custom domain defined in `wrangler.jsonc`. If the domain is not yet attached in Cloudflare, create it in the dashboard or let Wrangler create the custom domain route during deploy.

If the Cloudflare worker does not have `PROCESSOR_TOKEN` set, it will keep using the local analysis fallback and the site will still function. Set the secret later to switch the worker over to the Render processor.

## Local processor test

```bash
docker build -t openverify-processor .
docker run --rm -p 10000:10000 -e PROCESSOR_TOKEN=replace-me openverify-processor
curl -s http://127.0.0.1:10000/health
```

## Repo layout

- `cloudflare/worker` - Cloudflare API worker
- `cloudflare/processor` - external OCR / face matching processor
- `render.yaml` - Render blueprint for the processor service
- `PLAN.MD` - product and implementation plan
- `PRIVACY.MD` / `TERMS.MD` - legal documents

## Status

The frontend and API are live on `https://openverify.flat18.app`.

The worker is currently using local analysis fallback because the `PROCESSOR_TOKEN` secret is not yet set in Cloudflare. Set that secret later if you want the worker to proxy OCR / face matching to the Render processor.
