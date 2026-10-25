## Try the filesystem example

The command above exposes only `read_file` and `list_directory`. Replace `.` with the directory on the **host** that you want to share. Quote paths containing spaces. The server runs with the host’s permissions; the folder argument is a server setting, not an operating-system sandbox.

Create a `report.txt` file inside that directory. After connecting, ask the guest’s agent to list the directory and read the file using its absolute **host** path. Both calls should succeed. `write_file` is absent from the tool list and a forced call is rejected with JSON-RPC error `-32601`.

Other read tools are documented in the access table but are not enabled by default. Add their exact names to the allowlist only when needed. Reading files can reveal private data even when no write tools are available.

See [the CLI walkthrough](/docs#share) for a complete host-to-guest example and redaction output.
