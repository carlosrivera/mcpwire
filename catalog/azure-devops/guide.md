## Try Azure DevOps

Create a personal access token scoped to the organization and the read-only areas you want to share, and set `PERSONAL_ACCESS_TOKEN` in the host environment. The builder input supplies your organization name, and the launch pins `--authentication pat` so the token is used instead of a browser sign-in. This is Microsoft’s official local server; the docs recommend their remote server, which this catalog does not support.

Ask the agent to list projects with `core_list_projects`, then read work items with `wit_work_item`, search code with `search_code`, or inspect builds with `pipelines_build`. Wiki content and repository files flow to the guest while the session is open. Write tools (`wit_work_item_write`, `repo_file_write`, `repo_pull_request_write`, `pipelines_write`, `wiki_upsert_page`, and more) stay outside the default allowlist, as does `wit_backlog` because it can reorder the backlog.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
