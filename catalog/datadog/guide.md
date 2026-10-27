## Try Datadog

Create Datadog API and application keys with read-only permissions and set `DATADOG_API_KEY` and `DATADOG_APP_KEY` in the host environment (`DD_SITE` for non-US1 sites). Datadog ships an official MCP server, but it is remote-only and outside this catalog's stdio support, so this entry uses a maintained community server.

Ask the agent what is happening with `list_incidents`, then dig into a metric with `query_metrics`, a log search with `get_logs`, or a slow request with `list_traces`. Logs and traces carry real production payloads, so the key scope is what limits disclosure. The alert-acting tools (`mute_host`, `schedule_downtime`, and friends) stay outside the default allowlist — a guest muting a monitor could mask an outage.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
