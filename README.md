# Brokket real-estate news automation

This repository discovers recent Indian real-estate and infrastructure news, validates the city and exact article thumbnail, removes duplicates, and publishes accepted items to the Brokket API.

## Production automation

GitHub Actions is the only production runtime. The scheduled workflow runs every 20 minutes and scans the complete catalogue of 258 publisher, developer, infrastructure, and government sources. It also runs a dedicated real-estate/infrastructure search for every one of the 232 configured cities and geographies.

Every run performs a clean TypeScript build before publishing. It accepts only recent real-estate and infrastructure stories, rejects crime and unrelated content, requires a valid article thumbnail, assigns a configured city code, and sends accepted stories to the Brokket API.

Duplicate protection is persistent: canonical article URL and normalized-title SHA-256 hashes are stored in `state/news-state.json` without expiry. The workflow commits that state after every run, safely merges concurrent state changes, and prevents overlapping publishers from racing each other.

Every newly published record keeps a permanent audit trail containing its API code, title, description, canonical URL, exact thumbnail, city name/code, source name/logo, article publication time, delivery time, and active status. Per-run and daily city/source statistics are also retained.

Use the `backfill_20_days` workflow-dispatch option for a single 20-day historical run. Scheduled runs always use the normal 72-hour discovery window.

Configure `NEWS_API_ENDPOINT` as a GitHub Actions repository variable. When the API requires authentication, configure `NEWS_API_KEY` as a repository secret. The key is sent as a bearer token and is never committed or logged.

## Commands

```bash
pnpm install
pnpm build
pnpm news:run
pnpm report
```

Reports can be filtered and exported as JSON or CSV:

```bash
pnpm report -- --city mumbai --from 2026-09-01 --to 2026-09-30
pnpm report -- --source ETRealty --format csv
```

Legacy hashes imported from the old runtime remain protected against duplicates, but records that were originally stored only as hashes cannot be retroactively given reliable city metadata. All new deliveries contain the complete reporting fields.
