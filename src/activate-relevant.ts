import { isRelevant } from "./index";

type FeedNews = {
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
  || "http://ec2-13-126-103-246.ap-south-1.compute.amazonaws.com/api/feed-news").replace(/\/+$/, "");
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

async function activate(item: FeedNews): Promise<void> {
  const response = await fetch(`${endpoint}/${encodeURIComponent(item.code)}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      title: item.title,
      description: item.description,
      isActive: true,
      newsLink: item.newsLink,
      thumbnailImage: item.thumbnailImage,
      publisherName: item.publisherName,
      publisherTagline: item.publisherTagline,
      publisherLogo: item.publisherLogo,
      sourceName: item.sourceName,
      sourceLogo: item.sourceLogo,
      publishedAt: item.publishedAt,
      cityCode: item.cityCode,
    }),
  });
  const body = await response.json().catch(() => ({})) as { data?: { isActive?: boolean }; message?: string };
  if (!response.ok || body.data?.isActive !== true) {
    throw new Error(`${item.code}: ${body.message ?? `activation failed (${response.status})`}`);
  }
}

const first = await listPage(0);
const items = [...first.content];
for (let page = 1; page < first.totalPages; page += 1) {
  items.push(...(await listPage(page)).content);
}

const inactiveRelevant = items.filter((item) =>
  !item.isActive && isRelevant(`${item.title} ${item.description}`),
);
const failures: string[] = [];
let activated = 0;
for (let index = 0; index < inactiveRelevant.length; index += 8) {
  const batch = inactiveRelevant.slice(index, index + 8);
  const results = await Promise.allSettled(batch.map(activate));
  results.forEach((result) => {
    if (result.status === "fulfilled") activated += 1;
    else failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  });
}

console.log(JSON.stringify({
  scanned: items.length,
  inactiveRelevant: inactiveRelevant.length,
  activated,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
