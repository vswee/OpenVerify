# OpenVerify

OpenVerify is a Trinidad and Tobago-focused identity verification MVP built around a Cloudflare Worker API, Supabase persistence, and a Docker-based processing service on Render.

## Current live processor

- Render processor: `https://openverify.onrender.com`
- Health check: `GET /health`
- Analysis endpoint: `POST /analyze`

## Required configuration

### Worker environment

Set these values on the Cloudflare Worker:

- `PROCESSOR_URL=https://openverify.onrender.com`
- `PROCESSOR_TOKEN=<same secret used on Render>`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Render service

The Render service must have `PROCESSOR_TOKEN` set as a secret environment variable. Without it, `/health` will still work but `/analyze` will return `401`.

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

The processor service is deployed on Render, but the secret token still needs to be set in Render and mirrored into the Worker environment before end-to-end processing will work.
