## Try AWS Billing

Configure AWS credentials on the host the usual way — `AWS_PROFILE` for a named profile or the standard environment chain — with read-only Billing and Cost Management permissions (`ce:GetCostAndUsage`, `ce:GetDimensionValues`, `ce:GetTags`, `budgets:ViewBudget`, and related read actions). This is the official AWS Labs server, the successor to the archived cost-explorer server.

Ask the agent what identity it sees with `status`, then break down spend with `cost-explorer` (for example, costs by service for last month) or compare two months with `cost-comparison`. Nothing here writes to your AWS account, but Cost Explorer API calls cost roughly $0.01 each, so wide date-range queries add up. `session-sql` stays outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
