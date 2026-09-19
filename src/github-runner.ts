import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { runMonitor, type MonitorEnv } from "./index";

type StoredEntry = { value: string; expiresAt?: number };
type PersistedState = { version: 1; entries: Record<string, StoredEntry> };

class FileBackedKv {
  private state: PersistedState = { version: 1, entries: {} };

  constructor(private readonly path: string) {}

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as PersistedState;
      if (parsed.version === 1 && parsed.entries && typeof parsed.entries === "object") {
        this.state = parsed;
      }
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "";
      if (code !== "ENOENT") throw error;
    }
    this.removeExpired();
  }

  async get(key: string): Promise<string | null>;
  async get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  async get(key: string, type?: "json"): Promise<string | unknown | null> {
    const entry = this.state.entries[key];
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      delete this.state.entries[key];
      return null;
    }
    return type === "json" ? JSON.parse(entry.value) as unknown : entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.state.entries[key] = {
      value,
      ...(options?.expirationTtl
        ? { expiresAt: Date.now() + options.expirationTtl * 1_000 }
        : {}),
    };
  }

  async save(): Promise<void> {
    this.removeExpired();
    const entries = Object.fromEntries(
      Object.entries(this.state.entries).sort(([left], [right]) => left.localeCompare(right)),
    );
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`, "utf8");
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.state.entries)) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) delete this.state.entries[key];
    }
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const statePath = resolve(process.env.NEWS_STATE_PATH || "state/news-state.json");
const state = new FileBackedKv(statePath);
await state.load();

const env = {
  NEWS_STATE: state,
  BROKKET_API_URL: process.env.NEWS_API_ENDPOINT || "http://13.126.103.246/api/feed-news",
  MAX_AGE_HOURS: process.env.MAX_AGE_HOURS || "72",
} satisfies MonitorEnv;

try {
  const summary = await runMonitor(env, {
    sourceBatchSize: positiveInteger(process.env.SOURCE_BATCH_SIZE, 50),
    maxItems: positiveInteger(process.env.MAX_ITEMS_PER_RUN, 12),
    maxAttempts: positiveInteger(process.env.MAX_ATTEMPTS_PER_RUN, 20),
  });
  console.log(JSON.stringify({ event: "github_runner_complete", ...summary }));
  if (summary.failures.some((failure) => /^API (?:403|429|5\d\d):/.test(failure.error ?? ""))) {
    process.exitCode = 1;
  }
} finally {
  await state.save();
}
