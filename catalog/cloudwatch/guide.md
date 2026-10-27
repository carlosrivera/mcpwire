## Try CloudWatch

Configure AWS credentials on the host with read-only CloudWatch permissions (`AWS_PROFILE` or the standard chain). This is the official AWS Labs server, and every tool is read-only — a natural pairing with the AWS Billing and AWS Documentation guides.

Ask the agent what is alarming with `get_active_alarms`, then pull logs with `execute_log_insights_query`, metrics with `get_metric_data`, or Prometheus series with `execute_promql_query`. Log and metric contents flow to the guest, so the credential scope — not the allowlist — is what limits disclosure.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
