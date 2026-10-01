import { hasExcludedContent } from "./index";
import type { DeduplicationRecord } from "./deduplication";

type FeedNews = DeduplicationRecord & {
  code: string;
  title: string;
  description: string;
  isActive: boolean;
};

type ListResponse = {
  data?: { page?: { content?: FeedNews[]; totalPages?: number } };
};

const endpoint = (process.env.NEWS_API_ENDPOINT
  || "http://ec2-13-126-103-246.ap-south-1.compute.amazonaws.com/api/feed-news").replace(/\/+$/, "");
const headers: Record<string, string> = { "content-type": "application/json" };
const apiKey = process.env.NEWS_API_KEY?.trim();
if (apiKey) headers.authorization = `Bearer ${apiKey}`;
const dryRun = process.env.DEACTIVATE_IRRELEVANT_DRY_RUN === "1";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function listPage(page: number): Promise<{ content: FeedNews[]; totalPages: number }> {
  const response = await fetch(`${endpoint}/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({ page, size: 200 }),
  });
  if (!response.ok) throw new Error(`List request failed (${response.status})`);
  const body = await response.json() as ListResponse;
  return { content: body.data?.page?.content ?? [], totalPages: body.data?.page?.totalPages ?? 0 };
}

async function deactivate(item: FeedNews, attempt = 0): Promise<void> {
  const response = await fetch(`${endpoint}/${encodeURIComponent(item.code)}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...item, isActive: false }),
  });
  const body = await response.json().catch(() => ({})) as { data?: { isActive?: boolean }; message?: string };
  if (response.status === 429 && attempt < 3) {
    const retryHeader = Number(response.headers.get("retry-after") || "0");
    const retryMessage = Number(body.message?.match(/(\d+)\s*seconds?/i)?.[1] || "0");
    await wait((Math.max(2, retryHeader, retryMessage) + 1) * 1_000);
    return deactivate(item, attempt + 1);
  }
  if (!response.ok || body.data?.isActive !== false) {
    throw new Error(`${item.code}: ${body.message ?? `deactivation failed (${response.status})`}`);
  }
}

const first = await listPage(0);
const items = [...first.content];
for (let page = 1; page < first.totalPages; page += 1) items.push(...(await listPage(page)).content);

const activeIrrelevant = items.filter((item) => item.isActive && hasExcludedContent(`${item.title} ${item.description}`));
const failures: string[] = [];
let deactivated = 0;
if (!dryRun) {
  for (let index = 0; index < activeIrrelevant.length; index += 4) {
    const results = await Promise.allSettled(activeIrrelevant.slice(index, index + 4).map(deactivate));
    results.forEach((result) => {
      if (result.status === "fulfilled") deactivated += 1;
      else failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    });
  }
}

console.log(JSON.stringify({
  scanned: items.length,
  dryRun,
  activeIrrelevant: activeIrrelevant.length,
  deactivated,
  items: activeIrrelevant.map(({ code, title, cityCode }) => ({ code, title, cityCode })),
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
