# Fly recovery

The clean recovered source is in:

- `dashboard-clean/app` — Next.js dashboard application, including `Dockerfile`, `fly.toml`, `package.json`, and `package-lock.json`.
- `gateway-clean/app` — TypeScript gateway application, including `package.json`, `package-lock.json`, and compiled `dist` output.
- `database-source` — `schema.sql` and 26 SQL migration files from the core database image.

The downloaded source intentionally excludes `node_modules`, Next.js build output, `.env` files, and the gateway's persistent WhatsApp session directory. Reinstall dependencies with `npm ci` after opening the individual app folders.

The temporary archive files are retained as a second copy of the recovered source. Older `app`, `database`, `core`, `dashboard`, and `gateway` folders are partial or placeholder recovery attempts; use the three clean locations above.
