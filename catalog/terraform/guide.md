## Try Terraform

No credentials are needed for the default allowlist — documentation search hits the public registry, and Checkov scans read local files. This is the official AWS Labs server for AWS-focused Terraform and Terragrunt workflows.

Ask the agent to look up a resource with `search_aws_provider_docs`, find a module with `search_specific_aws_ia_modules`, or audit a directory with `run_checkov_scan`. The command runners (`execute_terraform_command`, `execute_terragrunt_command`) stay outside the allowlist — `apply` against shared infrastructure is exactly the kind of call that deserves a human approval.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
