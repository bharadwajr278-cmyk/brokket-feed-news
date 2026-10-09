import { isRelevant } from "./index";
import { duplicateLoserCodes, type DeduplicationRecord } from "./deduplication";
import { publisherNameForCity } from "./cities";

type FeedNews = DeduplicationRecord & {
  code: string;
  title: string;
  description: string;
  isActive: boolean;
  newsLink: string;
  thumbnailImage: string;
  publisherName: string;
  publisherTagline: string;
  publisherLogo: string;
  sourceName: string;
  sourceLogo: string;
  publishedAt: string;
  cityCode: string;
};

type ListResponse = {
  data?: {
    page?: {
      content?: FeedNews[];
      totalPages?: number;
    };
  };
};

const endpoint = (process.env.NEWS_API_ENDPOINT
  || "http://65.2.3.60/api/feed-news").replace(/\/+$/, "");
const headers: Record<string, string> = { "content-type": "application/json" };
const apiKey = process.env.NEWS_API_KEY?.trim();
if (apiKey) headers.authorization = `Bearer ${apiKey}`;

async function listPage(page: number): Promise<{ content: FeedNews[]; totalPages: number }> {
  const response = await fetch(`${endpoint}/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({ page, size: 200 }),
  });
  if (!response.ok) throw new Error(`List request failed (${response.status})`);
  const body = await response.json() as ListResponse;
  return {
    content: body.data?.page?.content ?? [],
    totalPages: body.data?.page?.totalPages ?? 0,
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function updateItem(item: FeedNews, isActive: boolean, attempt = 0): Promise<void> {
  const publisherName = publisherNameForCity(item.cityCode);
  const response = await fetch(`${endpoint}/${encodeURIComponent(item.code)}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      title: item.title,
      description: item.description,
      isActive,
      newsLink: item.newsLink,
      thumbnailImage: item.thumbnailImage,
      publisherName,
      publisherTagline: item.publisherTagline,
      publisherLogo: item.publisherLogo,
      sourceName: item.sourceName,
      sourceLogo: item.sourceLogo,
      publishedAt: item.publishedAt,
      cityCode: item.cityCode,
    }),
  });
  const body = await response.json().catch(() => ({})) as { data?: { isActive?: boolean }; message?: string };
  if (response.status === 429 && attempt < 3) {
    const retryHeader = Number(response.headers.get("retry-after") || "0");
    const retryMessage = Number(body.message?.match(/(\d+)\s*seconds?/i)?.[1] || "0");
    const retrySeconds = Math.max(2, retryHeader, retryMessage);
    await wait((retrySeconds + 1) * 1_000);
    return updateItem(item, isActive, attempt + 1);
  }
  if (!response.ok || body.data?.isActive !== isActive) {
    throw new Error(`${item.code}: ${body.message ?? `update failed (${response.status})`}`);
  }
}

const first = await listPage(0);
const items = [...first.content];
for (let page = 1; page < first.totalPages; page += 1) {
  items.push(...(await listPage(page)).content);
}

const duplicateCodes = duplicateLoserCodes(items);
const inactiveRelevant = items.filter((item) =>
  !item.isActive
  && !duplicateCodes.has(item.code)
  && isRelevant(`${item.title} ${item.description}`),
);
const publisherCorrections = items.filter((item) =>
  item.publisherName !== publisherNameForCity(item.cityCode)
  && !inactiveRelevant.some((candidate) => candidate.code === item.code),
);
const failures: string[] = [];
let activated = 0;
for (let index = 0; index < inactiveRelevant.length; index += 4) {
  const batch = inactiveRelevant.slice(index, index + 4);
  const results = await Promise.allSettled(batch.map((item) => updateItem(item, true)));
  results.forEach((result) => {
    if (result.status === "fulfilled") activated += 1;
    else failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  });
}
let publisherNamesCorrected = 0;
for (let index = 0; index < publisherCorrections.length; index += 4) {
  const batch = publisherCorrections.slice(index, index + 4);
  const results = await Promise.allSettled(batch.map((item) => updateItem(item, item.isActive)));
  results.forEach((result) => {
    if (result.status === "fulfilled") publisherNamesCorrected += 1;
    else failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  });
}

console.log(JSON.stringify({
  scanned: items.length,
  inactiveRelevant: inactiveRelevant.length,
  activated,
  publisherCorrections: publisherCorrections.length,
  publisherNamesCorrected,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
