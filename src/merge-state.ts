import { readFile, writeFile } from "node:fs/promises";

type StoredEntry = { value: string; expiresAt?: number };
type PersistedState = { version: 1; entries: Record<string, StoredEntry> };

async function readState(path: string): Promise<PersistedState> {
  const state = JSON.parse(await readFile(path, "utf8")) as PersistedState;
  if (state.version !== 1 || !state.entries || typeof state.entries !== "object") {
    throw new Error(`Invalid news state: ${path}`);
  }
  return state;
}

const [incomingPath, targetPath] = process.argv.slice(2);
if (!incomingPath || !targetPath) {
  throw new Error("Usage: pnpm state:merge <incoming-state> <target-state>");
}

const [incoming, target] = await Promise.all([
  readState(incomingPath),
  readState(targetPath),
]);
const now = Date.now();
const entries: Record<string, StoredEntry> = { ...target.entries, ...incoming.entries };

for (const [key, entry] of Object.entries(entries)) {
  if (key.startsWith("sent:") || key.startsWith("senttitle:")) {
    delete entry.expiresAt;
  } else if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
    delete entries[key];
  }
}

const sorted = Object.fromEntries(
  Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
);
await writeFile(targetPath, `${JSON.stringify({ version: 1, entries: sorted }, null, 2)}\n`, "utf8");
