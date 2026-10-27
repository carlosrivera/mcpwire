## Try Heroku

Set `HEROKU_API_KEY` in the host environment, from a Heroku account token. This is the official server from Heroku.

Ask the agent to list apps with `list_apps`, tail logs with `get_app_logs`, or diagnose the database with `pg_outliers` and `pg_locks`. Logs and query stats flow to the guest while the session is open. Everything that changes production — deploys, pipeline promotion, dyno scaling, maintenance mode, `pg_psql` — stays outside the default allowlist, and the token's app permissions are the real boundary.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
