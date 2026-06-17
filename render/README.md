# Render Docker Processor

This service is the external processing backend for OpenVerify when the Cloudflare Worker is configured with `PROCESSOR_URL`.

Render supports Docker-based web services and Blueprints through `render.yaml` at the repo root. This repository's blueprint deploys the repo-root `Dockerfile`, which copies `cloudflare/processor` into the image and starts the processor service.

Current service URL: `https://openverify.onrender.com`

## Render setup

- Service type: `web`
- Plan: `free` for the MVP
- Runtime: `docker`
- Dockerfile: `./Dockerfile`
- Build context: repository root
- Health check path: `/health`
- Secret env var: `PROCESSOR_TOKEN`

Render assigns the public service URL after deploy. Point the Worker at that URL with `PROCESSOR_URL` and reuse the same `PROCESSOR_TOKEN`.
If `PROCESSOR_TOKEN` is missing, health checks will still pass but `/analyze` will return `401`.

## Local parity

The container listens on port `10000` and binds to `0.0.0.0`, which matches Render's web service runtime.

```bash
docker build -t openverify-processor .
docker run --rm -p 10000:10000 -e PROCESSOR_TOKEN=replace-me openverify-processor
```

## Worker configuration

Set these values in the Cloudflare Worker environment:

- `PROCESSOR_URL=https://openverify.onrender.com`
- `PROCESSOR_TOKEN=<same-secret-as-the-render-service>`

If you use a custom domain on Render, point `PROCESSOR_URL` at that domain instead of the default `onrender.com` URL.
