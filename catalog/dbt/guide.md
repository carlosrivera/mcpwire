## Try dbt

Point the host at your dbt environment — `DBT_HOST` and `DBT_TOKEN` for dbt Cloud features, or `DBT_PROJECT_DIR` for a local project. This is the official server from dbt Labs.

Every tool is read-only, which makes this one of the safest servers to share. Ask the agent what models exist with `get_all_models`, trace dependencies with `get_lineage`, check freshness with `get_model_health`, or answer a business question with `query_metrics` against the semantic layer. Metric results are warehouse reads, so data your credentials can see flows to the guest.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
