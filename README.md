# Brokket real-estate news automation

This repository discovers recent Indian real-estate and infrastructure news, validates the city and exact article thumbnail, removes duplicates, and publishes accepted items to the Brokket API.

## Production automation

GitHub Actions is the primary scheduler and runs every five minutes. It is used for delivery because the current Brokket API raw-IP endpoint rejects Cloudflare Worker egress with HTTP 403, while ordinary server requests are accepted.

Each run checks the five core publishers plus 50 rotating sources. The full 258-source catalogue is covered in approximately 30 minutes. State is stored in `state/news-state.json`; URL and normalized-title hashes prevent duplicate publication.

The Cloudflare Worker remains available for `/health`, `/sources`, and `/last-run`, but its Cron Trigger is disabled to avoid the Workers Free plan's 10 ms CPU limit.

## Commands

```bash
pnpm install
pnpm types
pnpm check
pnpm news:run
pnpm deploy
```

The production endpoint defaults to `http://13.126.103.246/api/feed-news` and can be overridden with `NEWS_API_ENDPOINT` for the GitHub runner.
