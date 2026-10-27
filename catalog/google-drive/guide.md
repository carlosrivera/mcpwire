## Try Google Drive

This server needs one-time OAuth setup on the host: create a Google Cloud project, enable the Drive API, and download Desktop-app OAuth credentials as `gcp-oauth.keys.json` with the `drive.readonly` scope. Put the file in the directory you launch the server from (or set `GDRIVE_OAUTH_PATH`), then authenticate once so the access token is cached (`GDRIVE_CREDENTIALS_PATH` controls the cache location). This is the archived reference server.

Ask the agent to find documents with `search` — results contain file names and MIME types. Reading document contents happens through MCP resources (`gdrive:///<file_id>`), which travel over the same P2P session; Docs export as Markdown, Sheets as CSV. Only files the OAuth account can open are reachable, so use an account scoped to the folder set you want to share.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
