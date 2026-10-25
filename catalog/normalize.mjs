// Shared, browser-compatible catalog adapter. This module never launches a server.
export function shellQuote(value) {
  return /^[A-Za-z0-9_./:@=+,-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

export function resolveLaunch(server, policy, inputs = {}) {
  if (server.packages?.length !== 1 || server.remotes?.length) throw new Error(`${policy.slug}: exactly one local package is supported`);
  const pkg = server.packages[0];
  if (pkg.transport?.type !== 'stdio') throw new Error(`${policy.slug}: only stdio is supported`);
  if (!pkg.version || !/^[0-9]+(?:\.[0-9]+)*(?:[-+][A-Za-z0-9.-]+)?$/.test(pkg.version)) throw new Error(`${policy.slug}: pin a numeric package version`);
  const command = {npm:'npx', pypi:'uvx'}[pkg.registryType];
  if (!command || (pkg.runtimeHint && pkg.runtimeHint !== command)) throw new Error(`${policy.slug}: unsupported package runtime`);
  if (pkg.registryBaseUrl && pkg.registryBaseUrl !== ({npm:'https://registry.npmjs.org',pypi:'https://pypi.org'}[pkg.registryType])) throw new Error(`${policy.slug}: custom registries are not supported`);
  const environment = new Set();
  for (const variable of pkg.environmentVariables ?? []) {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(variable.name) || environment.has(variable.name)) throw new Error(`${policy.slug}: invalid or duplicate environment variable`);
    if (variable.value !== undefined || variable.default !== undefined || variable.variables) throw new Error(`${policy.slug}: environment variables must be inherited, never stored in the catalog`);
    environment.add(variable.name);
  }
  const used = new Set();
  function argument(arg) {
    if (arg.isRepeated) throw new Error(`${policy.slug}: repeated arguments are not supported yet`);
    if (arg.type === 'named' && !/^--?[A-Za-z0-9][A-Za-z0-9-]*$/.test(arg.name)) throw new Error(`${policy.slug}: invalid argument name`);
    if (arg.type === 'named' && arg.value === undefined && !arg.variables) return [arg.name];
    if (!['named','positional'].includes(arg.type) || typeof arg.value !== 'string') throw new Error(`${policy.slug}: arguments need a type and explicit value`);
    const value = arg.value.replace(/\{([^{}]+)\}/g, (_, key) => {
      const definition = arg.variables?.[key];
      if (!definition || definition.isSecret) throw new Error(`${policy.slug}: unknown or secret input ${key}`);
      used.add(key);
      const resolved = inputs[key] ?? policy.inputs[key]?.example;
      if (typeof resolved !== 'string' || !resolved.length || /[\r\n\0]/.test(resolved)) throw new Error(`${policy.slug}: missing or invalid input ${key}`);
      return resolved;
    });
    if (/[{}\r\n\0]/.test(value)) throw new Error(`${policy.slug}: unresolved or invalid argument`);
    if (arg.type === 'named' && !/^--?[A-Za-z0-9][A-Za-z0-9-]*$/.test(arg.name)) throw new Error(`${policy.slug}: invalid argument name`);
    return arg.type === 'named' ? [arg.name, value] : [value];
  }
  const runtime = (pkg.runtimeArguments ?? []).flatMap(argument);
  const args = [...(command === 'npx' ? ['-y'] : []), ...runtime,
    `${pkg.identifier}${command === 'npx' ? '@' : '=='}${pkg.version}`,
    ...(pkg.packageArguments ?? []).flatMap(argument)];
  for (const key of Object.keys(policy.inputs)) if (!used.has(key)) throw new Error(`${policy.slug}: unused input ${key}`);
  for (const key of Object.keys(inputs)) if (!used.has(key)) throw new Error(`${policy.slug}: unknown input ${key}`);
  return { command, args };
}

export function normalizeEntry({server, policy}) {
  const launch = resolveLaunch(server, policy);
  const names = policy.tools.map(tool => tool.name);
  if (new Set(names).size !== names.length) throw new Error(`${policy.slug}: duplicate tool names`);
  for (const name of policy.defaults.allow) if (!names.includes(name)) throw new Error(`${policy.slug}: default tool ${name} is not declared`);
  if (!/[1-9]/.test(policy.defaults.ttl)) throw new Error(`${policy.slug}: TTL must be positive`);
  return {
    slug:policy.slug, name:server.title ?? server.name, category:policy.category, source:policy.source,
    package:server.packages[0].identifier, command:[launch.command,...launch.args].map(shellQuote).join(' '),
    tagline:policy.tagline, requirements:policy.requirements, docs:server.websiteUrl,
    tools:policy.tools, defaults:policy.defaults, icon:policy.icon, launch,
    catalogVersion:policy.schemaVersion, packageVersion:server.packages[0].version,
  };
}

export function createCatalog(entries) {
  const result = [];
  const slugs = new Set();
  for (const entry of entries) {
    const server = normalizeEntry(entry);
    if (slugs.has(server.slug)) throw new Error(`Duplicate server slug: ${server.slug}`);
    slugs.add(server.slug);
    result.push(server);
  }
  return result.sort((a,b) => a.name.localeCompare(b.name));
}
