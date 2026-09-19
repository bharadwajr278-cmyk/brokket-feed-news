# Brokket real-estate news automation

This repository discovers recent Indian real-estate and infrastructure news, validates the city and exact article thumbnail, removes duplicates, and publishes accepted items to the Brokket API.

## Production automation

GitHub Actions is the only production runtime. The scheduled workflow runs every 20 minutes and scans the complete catalogue of 258 publisher, developer, infrastructure, and government sources on every run.

Every run performs a clean TypeScript build before publishing. It accepts only recent real-estate and infrastructure stories, rejects crime and unrelated content, requires a valid article thumbnail, assigns a configured city code, and sends accepted stories to the Brokket API.

Duplicate protection is persistent: canonical article URL and normalized-title SHA-256 hashes are stored in `state/news-state.json` without expiry. The workflow commits that state after every run, and concurrency control prevents overlapping runs from racing each other.

Use the `backfill_20_days` workflow-dispatch option for a single 20-day historical run. Scheduled runs always use the normal 72-hour discovery window.

Configure `NEWS_API_ENDPOINT` as a GitHub Actions repository variable. When the API requires authentication, configure `NEWS_API_KEY` as a repository secret. The key is sent as a bearer token and is never committed or logged.

## Commands

```bash
pnpm install
pnpm build
pnpm news:run
```
