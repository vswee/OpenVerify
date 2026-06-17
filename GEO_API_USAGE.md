# Flat18 Vercel IP Geolocation Service

This document explains how the Vercel IP geolocation service works so you can call it from other Flat 18 apps. It covers the moving parts, refresh workflow, required secrets, and every HTTP endpoint plus its authorisation rules.

Production base URL: `https://geo.flat18.app`.

## System Architecture

1. **Vercel serverless functions** (`api/ipinfo.js`, `api/geo.js`, `api/refresh.js`, `api/freshness.js`) expose HTTPS endpoints for lookup, browser-friendly geo resolution, refresh dispatch, and metadata checks.
2. **Neon Postgres** stores MaxMind GeoLite2 City/ASN datasets in the `ipgeo` schema. The lookup function `ipgeo.ip_info(text)` merges the data needed for `GET /api/ipinfo`.
3. **GitHub Actions** hosts the heavy ETL work. When `/api/refresh` is triggered it calls the GitHub REST API to dispatch the `refresh-ipgeo.yml` workflow (or a user-specified workflow file/ref).
4. **Data loader script** (`scripts/load_geolite2_to_neon.sh`) runs inside the GitHub workflow. It downloads GeoLite2 CSV releases, swaps staging tables into place, (re)creates lookup SQL functions, and records the releases in `ipgeo.meta`.
5. **Automation**: a Vercel Cron job (configured in the project dashboard) hits `/api/refresh` daily, so the GitHub workflow keeps your Neon data current without long-running Vercel executions.

### Request Lifecycle

- Client → `GET /api/ipinfo`: Vercel function checks Basic or Bearer auth, determines the IP (query `ip` or `x-forwarded-for`), queries Neon via `@neondatabase/serverless`, and returns JSON with city + ASN info.
- Browser client → `GET /api/geo`: Vercel function resolves the caller IP from request headers without requiring auth, returns a browser-safe CORS response with `located: true|false`, and reuses the same lookup path and data as `/api/ipinfo`.
- Cron/Operator → `GET /api/refresh`: validates that the caller is Vercel Cron (`User-Agent: vercel-cron/1.0`) or presents the `token` query param. The function dispatches the configured GitHub workflow to reload data.
- Monitoring → `GET /api/freshness`: requires a bearer token (`FRESHNESS_TOKEN`). Returns the latest row in `ipgeo.meta` so you know when GeoLite data last refreshed.

## Environment Variables & Secrets

| Name | Required? | Used by | Purpose |
| --- | --- | --- | --- |
| `NEON_DATABASE_URL` | Yes | Vercel functions, loader | Postgres connection string (`...sslmode=require`). The loader also accepts `PSQL_URL` / `NEON_PSQL_URL` aliases. |
| `BASIC_USER` + `BASIC_PASS` | Either this pair **or** `API_TOKEN` | `/api/ipinfo` | HTTP Basic credentials for lookup requests. |
| `API_TOKEN` | Either this or Basic | `/api/ipinfo` | Static bearer token. Send `Authorization: Bearer <token>`. |
| `API_TOKEN` | Optional when using `?ip=` | `/api/geo` | Only needed if callers want to override the IP instead of using the caller IP. |
| `CRON_TOKEN` | Optional but recommended | `/api/refresh` | Manual trigger guard. Pass as `GET /api/refresh?token=$CRON_TOKEN`. Vercel Cron doesn’t need it if it uses the default user-agent. |
| `GH_OWNER` | Yes | `/api/refresh` | GitHub org/user that owns the repo with the workflow. |
| `GH_REPO` | Yes | `/api/refresh` | Repo name containing the workflow. |
| `GH_TOKEN` | Yes | `/api/refresh` | GitHub PAT with `workflow` scope so dispatches succeed. |
| `GH_WORKFLOW_FILE` | Optional (`refresh-ipgeo.yml` default) | `/api/refresh` | Filename of the workflow to dispatch. |
| `GH_REF` | Optional (`main` default) | `/api/refresh` | Git ref (branch/tag) to run the workflow on. |
| `FRESHNESS_TOKEN` | Optional | `/api/freshness` | Bearer token required if you expose the freshness endpoint. |
| `MAXMIND_LICENSE_KEY` | Needed wherever the loader runs | GitHub workflow / local scripts | GeoLite2 licence key used by `scripts/load_geolite2_to_neon.sh`. Supports `MAXMIND_HOSTS` override if you must pin download hosts. |
| `GH_OWNER`, `GH_REPO`, `GH_TOKEN`, `MAXMIND_LICENSE_KEY` should exist in both GitHub Actions secrets and Vercel envs when applicable. Use `scripts/setup_vercel_env.sh` to push the Vercel side non-interactively.

## Data Refresh Workflow

1. **Trigger**: Vercel Cron (or manual `curl` with the cron token) invokes `/api/refresh`.
2. **Dispatch**: The endpoint calls GitHub’s `workflow/dispatches` API using the repo + token env vars. Successful dispatch responds `202 {"status":"dispatched"}`.
3. **GitHub workflow** (see your `refresh-ipgeo.yml`) runs `scripts/load_geolite2_to_neon.sh` with `NEON_DATABASE_URL` and `MAXMIND_LICENSE_KEY` exported.
4. **Loader actions**:
   - Creates/maintains the `ipgeo` schema and base tables for City/ASN + metadata.
   - Loads CSVs into unlogged staging tables, indexes them, swaps them into production tables atomically.
   - Recreates helper SQL functions (`lookup_city`, `lookup_asn`, `ip_info`).
   - Inserts a row into `ipgeo.meta` capturing `loaded_at`, `source`, and the release folder names (e.g. `GeoLite2-City-CSV_20240102`).
5. **Verification**: Call `/api/freshness` (with `FRESHNESS_TOKEN`) to confirm the new `loaded_at` timestamp, or hit `/api/ipinfo?debug=1` for diagnostics.

## HTTP Endpoints

### `GET /api/ipinfo`

- **Purpose**: Return combined GeoLite city + ASN data for an IPv4/IPv6 address via Neon’s `ipgeo.ip_info` function. The response keeps the original field names and now also includes additive Cloudflare-style geo fields sourced from the same MaxMind dataset.
- **Auth**: Supply either `Authorization: Basic base64(user:pass)` using `BASIC_USER/BASIC_PASS`, or `Authorization: Bearer <API_TOKEN>`.
- **Query params**:
  - `ip` (optional): Lookup target. If omitted, the handler uses the first value from `x-forwarded-for` (set by Vercel) or the socket address.
  - `debug=1` (optional): Returns diagnostics (current DB/schema, presence of tables/function). Response is `{"debug": { ... }}` and is never cached.
  - `fields=ip,country,city` (optional): Comma-separated subset of response fields to return. Unknown field names are ignored.
- **Methods**: `GET` and `HEAD` are supported.
- **Validation**: If an `ip` query value is supplied and is not a valid IPv4/IPv6 address, the endpoint now returns `400 Invalid IP provided` instead of sending a pointless DB lookup.
- **Caching**: Successful lookups return `Cache-Control: private, max-age=60, stale-while-revalidate=30`. Warm function instances also keep a short in-memory cache, coalesce duplicate in-flight lookups, expose `X-Cache: HIT|MISS|BYPASS` plus `X-Resolved-IP`, and return an `ETag` so clients can use conditional requests.
- **Compatibility headers**: Successful lookups also emit Cloudflare-style response headers derived from the lookup result: `cf-ipcountry`, `cf-ipcontinent`, `cf-ipcity`, `cf-region`, `cf-region-code`, `cf-metro-code`, `cf-postal-code`, `cf-timezone`, `cf-iplatitude`, and `cf-iplongitude`.
- **Responses**:
  - `200 OK`: JSON payload with the following shape:

    | Field | Description |
    | --- | --- |
    | `ip` | IP string you asked for. |
    | `network` | CIDR string of the MaxMind block that matched. |
    | `continent` | Cloudflare-style continent code (for example `EU`). |
    | `continent_name` | Human-readable continent name from MaxMind. |
    | `country` | Two-letter ISO country code. |
    | `country_name` | Human-readable country name from MaxMind. |
    | `city` | City name (English MaxMind dataset). |
    | `region` | First-level subdivision name (state / province / region). |
    | `region_code` | First-level subdivision ISO code. |
    | `metro_code` | Metro code when MaxMind provides one. |
    | `postal_code` | Postal code when MaxMind provides one. |
    | `timezone` | TZ database name (e.g. `Europe/London`). |
    | `lat` / `lon` | Latitude & longitude in decimal degrees. |
    | `radius_km` | MaxMind accuracy radius in kilometres. |
    | `is_in_european_union` | Boolean EU membership flag from MaxMind. |
    | `asn` | Autonomous system number. |
    | `org` | ASN organisation name. |

  - `400 Bad Request`: Missing IP (only happens if Vercel doesn’t provide an address).
  - `401 Unauthorised`: No/incorrect Basic or Bearer credentials.
  - `404 Not Found`: `ipgeo.ip_info` returned nothing for that IP.
  - `500/502`: Neon query failure or the lookup function/schema is missing (the handler returns diagnostic info in this case to help troubleshoot deployments).

**Examples**

```bash
curl -u "$BASIC_USER:$BASIC_PASS" "https://geo.flat18.app/api/ipinfo?ip=1.1.1.1"

curl -H "Authorization: Bearer $API_TOKEN" "https://geo.flat18.app/api/ipinfo?ip=2606:4700:4700::1111"

curl -H "Authorization: Bearer $API_TOKEN" "https://geo.flat18.app/api/ipinfo?ip=1.1.1.1&fields=country,city,asn"

curl -H "Authorization: Bearer $API_TOKEN" "https://geo.flat18.app/api/ipinfo?ip=1.1.1.1&debug=1"
```

### `GET /api/geo`

- **Purpose**: Return the same geolocation dataset as `/api/ipinfo`, but in a browser-friendly format for Cloudflare Worker style consumers and front-end apps.
- **Auth**:
  - No auth is required when the endpoint resolves the caller IP from request headers.
  - If `ip` is supplied as a query parameter, the request must use the same Basic or Bearer auth as `/api/ipinfo`.
- **Query params**:
  - `ip` (optional): Explicit lookup target. Protected to avoid turning the public endpoint into an open arbitrary-IP lookup service.
  - `debug=1` (optional): Adds a `debug` object to successful responses and disables caching for that response so front-end or middleware troubleshooting can inspect request tracing details directly.
- **Methods**: `GET`, `HEAD`, and `OPTIONS` are supported.
- **CORS**: Responds with `Access-Control-Allow-Origin: *` and exposes the cache, trace, and Cloudflare-style geo headers to browser clients.
- **Response headers**:
  - `X-Request-Id`: Stable request identifier you can log in middleware and surface in the browser.
  - `X-Resolved-IP`: The IP that was ultimately looked up.
  - `X-IP-Source`: Where that IP came from (`query`, `x-vercel-forwarded-for`, `x-real-ip`, `x-forwarded-for`, or `remoteAddress`).
  - `X-Cache`: `HIT` or `MISS` for the in-memory lookup cache.
  - `Server-Timing`: Includes `geo;dur=...` so browser devtools can see lookup duration.
- **Responses**:
  - `200 OK`: On success returns `located: true` plus the full lookup payload. The response also adds `latitude` and `longitude` aliases alongside `lat` and `lon`.
  - `200 OK`: On lookup miss returns `{"located":false,"error":"No match","debug":{...}}`.
  - `503 Service Unavailable`: The GeoLite tables are missing or empty; returns `{"located":false,"error":"Geo database not loaded","debug":{...}}`.
  - `400 Bad Request`: Invalid explicit IP or no caller IP available; includes `debug` payload.
  - `401 Unauthorised`: Explicit `?ip=` lookup without valid Basic/Bearer auth; includes `debug` payload.
  - `504 Gateway Timeout`: Lookup exceeded the configured `GEO_LOOKUP_TIMEOUT_MS` limit and includes `debug` payload.
  - `500`: Lookup failure with `debug` payload.

**Examples**

```bash
curl "https://geo.flat18.app/api/geo"

curl -H "Origin: https://felt-weather.pages.dev" "https://geo.flat18.app/api/geo"

curl -H "Authorization: Bearer $API_TOKEN" "https://geo.flat18.app/api/geo?ip=1.1.1.1"

curl "https://geo.flat18.app/api/geo?debug=1"
```

### `GET /api/refresh`

- **Purpose**: Fire-and-forget trigger that tells GitHub Actions to reload GeoLite data into Neon.
- **Auth**:
  - Automatic if called by Vercel Cron because the platform sends `User-Agent: vercel-cron/1.0`.
  - Manual callers may either append `?token=$CRON_TOKEN` or send `Authorization: Bearer $CRON_TOKEN`.
- **Methods**: `GET` and `HEAD` are supported.
- **Behaviour**: Recent identical refresh requests are deduplicated for 30 seconds on warm instances to avoid accidental duplicate workflow dispatches.
- **Response headers**: Returns `Cache-Control: no-store`; duplicate refresh attempts also include `Retry-After` with the remaining cooldown.
- **Responses**:
  - `202 Accepted`: GitHub returned `204 No Content` meaning the workflow dispatch succeeded.
  - `401 Unauthorised trigger`: wrong/missing cron token and not a Vercel Cron request.
  - `500 Missing GH env configuration`: one of the `GH_*` vars is unset.
  - `502 GitHub dispatch failed`: GitHub responded with non-204; body text is bubbled up to help debugging (most often missing scopes or incorrect workflow filename).

**Examples**

```bash
curl "https://geo.flat18.app/api/refresh?token=$CRON_TOKEN"

curl -H "Authorization: Bearer $CRON_TOKEN" "https://geo.flat18.app/api/refresh"
```

Schedule this endpoint in the Vercel dashboard (Project → Settings → Cron Jobs) for 04:00 UTC or whatever cadence you need.

### `GET /api/freshness`

- **Purpose**: Optional monitoring endpoint that reports the last successful data load from `ipgeo.meta`.
- **Auth**: Requires `Authorization: Bearer $FRESHNESS_TOKEN`. If no token is configured, every request is rejected to avoid exposing metadata accidentally.
- **Methods**: `GET` and `HEAD` are supported.
- **Caching**: Returns `Cache-Control: private, max-age=15, stale-while-revalidate=15` plus `X-Cache` and `ETag` headers. Warm instances keep a short in-memory cache and coalesce duplicate in-flight Neon reads.
- **Response**:
  - `200 OK`: JSON row from `ipgeo.meta`, e.g. `{"loaded_at":"2024-03-12T04:05:00Z","source":"geolite2","city_release":"GeoLite2-City-CSV_20240312","asn_release":"GeoLite2-ASN-CSV_20240312"}`.
  - `401 Unauthorised`: Missing/incorrect bearer token.
  - `500 Query failed`: Neon issue (check logs/connection string).

**Example**

```bash
curl -H "Authorization: Bearer $FRESHNESS_TOKEN" "https://geo.flat18.app/api/freshness"
```

## Integrating From Another Flat 18 App

1. Install your Flat 18 app’s secret store (e.g. Doppler, Vercel, or environment vault) with the same auth material (`API_TOKEN` or Basic credentials).
2. Add an HTTP client module that wraps calls to `https://geo.flat18.app/api/ipinfo`. Keep retries short (<1s) because the function is fast and rate-limited mainly by Vercel.
3. Treat lookups as cacheable for ~1 minute to match the API’s cache headers.
4. If you need operational visibility, wire a scheduled job that hits `/api/freshness` nightly and alerts if `loaded_at` is older than expected.
5. For backfills or forced reloads, call `/api/refresh?token=$CRON_TOKEN` from a secure CI/CD context rather than from user-triggered flows.

With these pieces in place, any Flat 18 app can reuse the existing geolocation backend without duplicating ETL or licensing work.
