## Try Home Assistant

Set `HA_URL` to your instance's address and `HA_TOKEN` to a long-lived access token (your profile → Security in Home Assistant). Home Assistant ships its own MCP integration, but this standalone server is the popular way to connect from outside the instance.

Ask the agent for a `system_overview`, then check a room with `get_entities_by_area`, review overnight temperatures with `get_history_range`, or see what's wrong with `get_error_log`. Your home's state, presence history, and sensor data are personal — the token scope is the boundary. Device control (`entity_action`, `call_service_tool`) stays outside the allowlist so a guest turning off the lights needs your approval; dashboard edits and `restart_ha` always require approval too.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
