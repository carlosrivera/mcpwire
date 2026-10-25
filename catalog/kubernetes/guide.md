## Try Kubernetes

Use a development cluster and a kubeconfig identity with restricted RBAC permissions. The server inherits the host’s kubectl configuration.

Ask the agent to inspect the default resource-listing tool from the access table against a test namespace. Results should match the kubeconfig identity’s permissions. Tool filtering does not replace namespace restrictions or Kubernetes RBAC.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
