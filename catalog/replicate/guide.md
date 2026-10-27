## Try Replicate

Set `REPLICATE_API_TOKEN` in the host environment. This is Replicate's official server.

Ask the agent to find a model with `search_models`, read its card with `get_models_readme`, or inspect your deployments with `list_deployments`. Browsing is safe to delegate; running predictions costs real money per call, so both prediction tools stay outside the default allowlist — as do every create and delete tool for models and deployments.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
