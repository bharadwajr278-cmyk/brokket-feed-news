import { readFile } from "node:fs/promises";

type StoredEntry = { value: string; expiresAt?: number };
type PersistedState = { version: 1; entries: Record<string, StoredEntry> };
type SentRecord = {
  version?: number;
  url?: string;
  title?: string;
  description?: string;
  thumbnailImage?: string;
  apiCode?: string | null;
  cityCode?: string;
  cityName?: string;
  sourceName?: string;
  sourceLogo?: string;
  publishedAt?: string;
  sentAt?: string;
  isActive?: boolean;
};

function option(name: string): string | undefined {
  const exact = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (exact) return exact.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function tally(records: SentRecord[], key: "cityCode" | "sourceName"): Record<string, number> {
  return Object.fromEntries(Object.entries(records.reduce<Record<string, number>>((counts, record) => {
    const value = record[key] || "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort(([left], [right]) => left.localeCompare(right)));
}

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const statePath = option("state") || process.env.NEWS_STATE_PATH || "state/news-state.json";
const city = option("city")?.toLocaleLowerCase("en-IN");
const source = option("source")?.toLocaleLowerCase("en-IN");
const from = option("from");
const to = option("to");
const format = option("format") || "json";
const state = JSON.parse(await readFile(statePath, "utf8")) as PersistedState;
const sentEntries = Object.entries(state.entries).filter(([key]) => key.startsWith("sent:"));
const records: SentRecord[] = [];
let legacyRecords = 0;

for (const [, entry] of sentEntries) {
  if (!entry.value.startsWith("{")) {
    legacyRecords += 1;
    continue;
  }
  try {
    const record = JSON.parse(entry.value) as SentRecord;
    if (record.version !== 2) {
      legacyRecords += 1;
      continue;
    }
    if (record.isActive === false) continue;
    if (city && ![record.cityCode, record.cityName].some((value) => value?.toLocaleLowerCase("en-IN").includes(city))) continue;
    if (source && !record.sourceName?.toLocaleLowerCase("en-IN").includes(source)) continue;
    if (from && (!record.sentAt || record.sentAt.slice(0, 10) < from)) continue;
    if (to && (!record.sentAt || record.sentAt.slice(0, 10) > to)) continue;
    records.push(record);
  } catch {
    legacyRecords += 1;
  }
}
records.sort((left, right) => String(right.sentAt).localeCompare(String(left.sentAt)));

if (format === "csv") {
  const columns: Array<keyof SentRecord> = [
    "apiCode", "title", "cityCode", "cityName", "sourceName", "publishedAt",
    "sentAt", "url", "thumbnailImage", "isActive",
  ];
  console.log(columns.join(","));
  for (const record of records) console.log(columns.map((column) => csvCell(record[column])).join(","));
} else {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    filters: { city: city ?? null, source: source ?? null, from: from ?? null, to: to ?? null },
    totals: {
      permanentUrlHashes: sentEntries.length,
      matchingDetailedRecords: records.length,
      legacyRecordsWithoutFullMetadata: legacyRecords,
    },
    byCity: tally(records, "cityCode"),
    bySource: tally(records, "sourceName"),
    records,
  }, null, 2));
}
