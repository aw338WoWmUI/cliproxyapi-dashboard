import yaml from "js-yaml";

type ConfigYamlObject = Record<string, unknown>;

export function isValidGoDuration(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const raw = value.trim();
  const parts = [...raw.matchAll(/(\d+(?:\.\d*)?|\.\d+)(ns|us|µs|μs|ms|s|m|h)/g)];
  if (!parts.length || parts.map((part) => part[0]).join("") !== raw) return false;
  const units: Record<string, number> = { ns: 1, us: 1e3, µs: 1e3, μs: 1e3, ms: 1e6, s: 1e9, m: 60e9, h: 3600e9 };
  const nanoseconds = parts.reduce((sum, part) => sum + Math.trunc(Number(part[1]) * (units[part[2] ?? ""] ?? 0)), 0);
  return Number.isFinite(nanoseconds) && nanoseconds > 0 && nanoseconds < 2 ** 63;
}

function isPlainObject(value: unknown): value is ConfigYamlObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseConfigYaml(rawYaml: string): ConfigYamlObject {
  if (!rawYaml.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(rawYaml);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid current config.yaml: ${message}`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(
      "Invalid current config.yaml: root value is not a YAML mapping"
    );
  }

  const routing = parsed.routing;
  if (isPlainObject(routing) && "session-affinity-ttl" in routing && !isValidGoDuration(routing["session-affinity-ttl"])) {
    throw new Error("Invalid session-affinity-ttl: use a positive Go duration such as 1h or 24h");
  }

  return parsed;
}

export function mergeConfigYaml(rawYaml: string, changes: ConfigYamlObject): string {
  const mergedConfig = { ...parseConfigYaml(rawYaml) };

  for (const [key, value] of Object.entries(changes)) {
    if (isPlainObject(value) && isPlainObject(mergedConfig[key])) {
      mergedConfig[key] = {
        ...(mergedConfig[key] as ConfigYamlObject),
        ...value,
      };
      continue;
    }

    mergedConfig[key] = value;
  }

  return yaml.dump(mergedConfig, { lineWidth: -1, noRefs: true });
}
