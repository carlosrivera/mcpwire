# Contributing to MCPWire

Add a server by contributing a catalog folder. Guides and the command builder read the same definitions; no Astro page or CLI changes are needed for supported packages.

All 71 server definitions live in `catalog/`. Add new contributions there. The same loader supplies the guides, directory, and builder; duplicate slugs fail validation.

## Get started

From the repository root, with Node.js 18.20+ (Node.js 20 recommended):

```bash
pnpm install --frozen-lockfile
pnpm run check:catalog
pnpm run test:catalog
pnpm run build:web
pnpm run dev:web
```

Open `/teleport/<slug>` and `/builder`. Confirm that the guide command and the builder use the same package version, launch arguments, and default allowlist.

## Add a definition

Copy `catalog/filesystem/` for npm packages, or `catalog/sqlite/` for PyPI packages. Rename the directory and update these three files:

```text
catalog/<slug>/
  server.json       package identity, version, launch arguments and input descriptions
  mcpwire.json      site metadata, example inputs, explicit policy and tool notes
  guide.md          setup details and a reproducible example
```

`server.json` follows the vendored [official MCP Registry schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json). This describes an upstream server; it does not claim that our catalog entry is published to the official registry or that we own its namespace. Preserve the upstream identity and source URL; do not invent ownership claims.

`mcpwire.json` follows [`schemas/mcpwire.schema.json`](schemas/mcpwire.schema.json), with `schemaVersion: 1`. Unknown policy fields are rejected. Its slug must match the folder name. `server.json` must include a title and documentation URL.

### Supported launch format

Currently supported: exactly one package, with `transport.type: "stdio"`, and either:

| Package | Runner | Generated package argument |
| --- | --- | --- |
| `registryType: "npm"` | `npx` | `name@version` |
| `registryType: "pypi"` | `uvx` | `name==version` |

Pin a specific numeric package version. Set `runtimeHint` to the runner. Use `runtimeArguments` for runner options (such as SQLite’s `--with mcp<2`), and `packageArguments` for options passed to the MCP server.

Each argument has `type: "positional"` or `type: "named"`, a string `value`, and a `name` for named arguments. A named argument with no `value` is a standalone flag, such as `--read-only` or `--stdio`. Values can contain `{input_name}` placeholders. Declare each placeholder in that argument’s `variables` object and provide a non-secret example in `mcpwire.json`:

```json
{
  "type": "positional",
  "valueHint": "directory",
  "value": "{directory}",
  "variables": {
    "directory": {
      "description": "Host folder to expose",
      "format": "filepath",
      "isRequired": true
    }
  }
}
```

```json
"inputs": {
  "directory": { "example": "." }
}
```

The loader resolves examples into an executable plus an argument array. Display commands are shell-quoted; execution tests use argument arrays without a shell. The builder’s command field remains editable so users can substitute their own host paths.

Declare host environment requirements using the official package `environmentVariables` array. Give each variable a `name`, `description`, `isRequired`, and `isSecret`. Variables are inherited from the host process; the loader does not read their values, inject credentials, or embed them in generated commands. Document how the host supplies them. Stored `value`, `default`, and templated environment-variable values are rejected. See `catalog/figma/server.json` for an example.

Remote transports, multiple packages, custom registries, secret argument inputs, and repeated arguments are not supported. Extend the loader and its tests before contributing a server that needs them. Never put real credentials in a definition or example.

### Choose default access explicitly

List documented tools under `tools`, with an exact `name`, a `risk` (`safe`, `caution`, or `high`), and an honest `note`. The labels are editorial descriptions, not enforced security guarantees.

`defaults.allow` is the only source of default tool access. A newly documented tool stays disabled even if its risk is `safe`. An empty array generates an explicit `--allow ""`; it does not fall back to unrestricted access. Defaults must reference declared tools, and tool names must be unique.

Set `defaults.redactSecrets` and a positive `defaults.ttl` explicitly. Explain arguments that can expose sensitive data or cause side effects. MCPWire filters tool names; it does not validate SQL, sandbox subprocesses, or guarantee that secret patterns catch everything.

### Write the guide and choose an icon

Write `guide.md` using ordinary Markdown and relative-independent links such as `/docs#share`. It appears below the generated command and tool table. Explain prerequisites, host paths, a concrete tool call, its expected result, and any server-specific limitations. Avoid duplicating the full launch command; it is generated from metadata.

Set `icon` to an existing `/icons/<name>.svg` in `web/public/icons`, or add an inert SVG there. Record new icon sources and licensing in `web/public/icons/SOURCES.md`. Active content and external resources are rejected. Catalog icons appear on guide titles and directory cards.

## Checks and review

```bash
pnpm run check:catalog
pnpm run test:catalog
pnpm run build:web
```

These checks are offline and do not execute contributed server packages. They validate both schemas, supported launch configuration, unique slugs, placeholders, explicit tool defaults, guides, icons, and policy/quoting regressions. PR CI runs these checks and builds all pages.

Package metadata checks are separate and require network access:

```bash
pnpm --filter mcpwire-web run check:servers
```

Runtime verification is an explicit maintainer step. Review the package source and arguments first, then run in an isolated environment without production credentials:

```bash
pnpm install --frozen-lockfile
# uvx is also required for SQLite
pnpm run test:catalog:integration
```

This executes the pinned filesystem and SQLite packages from the catalog through a real SDK client → CLI join → local DHT/Noise connection → CLI share → MCP server. It checks tool discovery, reads/SELECT, redaction, denied writes, recording, startup failure, and final-response delivery at the call limit. It uses a local bootstrap node, not a cross-network NAT traversal test. For the reviewed set of additional initialization checks, run `pnpm --filter @mcpwire/cli run test:examples`. Some pinned packages require Node.js 24; check each entry’s prerequisites. These checks use catalog-pinned launch arguments; fixtures supply a temporary Git checkout or dummy credentials where needed. They check MCP initialization and default tool names without making authenticated service calls. Adding a folder does not automatically execute its package. Other entries still need a reviewed runtime fixture and any service prerequisites.

Include the commands and results you actually ran in your PR. Do not mark a server verified solely because its metadata validates. Any package version or default-policy update needs another review and runtime check.

## Build and run the CLI from source

For development, use the repository checkout rather than the published npm package:

```bash
pnpm install --frozen-lockfile
pnpm run build:cli
node cli/dist/index.js --help
pnpm run test:cli
```

Replace `npx -y @mcpwire/cli` in a documentation example with `node cli/dist/index.js` when running from the repository root. In a guest MCP configuration, use `command: "node"` and pass the absolute path to that guest machine’s `cli/dist/index.js` before `join` and the ticket.

The client launches `join` as a stdio transport. Its stdin/stdout carry MCP messages; diagnostics use stderr. Each peer connection starts a separate server child process on the host, inheriting its environment and working directory. Keep protocol output separate from diagnostic logs when changing the CLI.

## Network test setup

The filesystem and SQLite documentation examples are exercised with a real MCP SDK client through separate CLI host and guest processes, using a local DHT bootstrap node. This verifies protocol handling, filtering, redaction, recording, and session limits. It does not establish connectivity between two machines on different networks.

To use an existing bootstrap node in a controlled environment, set this variable for both host and guest processes:

```bash
export MCPWIRE_BOOTSTRAP="127.0.0.1:49737"
```

The example requires a node already listening on that port, and loopback works only on the same machine. Across machines, use a mutually reachable host and port. Multiple nodes can be comma-separated. The variable selects bootstrap nodes; it does not start one or provide a relay. The integration test creates and cleans up its own local bootstrap node.

For a public-discovery check:

```bash
pnpm run build:cli
MCPWIRE_E2E_RUNS=1 node cli/test/e2e-real.mjs --public
```

This still runs both processes on one machine. Test across two real networks separately before making NAT traversal or connection-reliability claims. Calls are not automatically replayed after a disconnect.


## Search metadata and social previews

Each catalog entry may define `seo.title` (without the MCPWire suffix) and `seo.description` in `mcpwire.json`. Describe that server’s actual setup and capabilities; avoid generic claims that its tools are safe. The guide falls back to generated metadata for new entries.

The shared layout owns canonicals, Open Graph/Twitter tags, and the structured-data graph. Server pages add breadcrumbs and a technical article describing their visible guide. Do not add invented reviews, rankings, dates, or claims of rich-result eligibility.

`pnpm run build:web` generates 1200×630 PNG previews from the catalog and builds the sitemap. Run `pnpm run test:seo` afterwards to check every rendered page, metadata uniqueness, social-image files, structured data, and sitemap coverage. The 404 page is deliberately excluded from indexing and the sitemap. Query variants such as `/builder/?server=sqlite` canonicalize to `/builder/`.
