import { CITY_PATTERNS, CityPattern } from "./cities";
import { ALL_SOURCES, CORE_SOURCES, NewsSource, ROTATING_SOURCES } from "./sources";

type FeedItem = {
  title: string;
  link: string;
  publishedAt: string;
  sourceName: string;
  sourceDomain: string;
  description: string;
  cityHint?: CityPattern;
  ambiguousCityHint?: boolean;
};

type PushResult = {
  title: string;
  status: "sent" | "failed" | "skipped";
  cityCode: string;
  cityName: string;
  sourceName: string;
  publishedAt: string;
  code?: string;
  articleUrl?: string;
  error?: string;
};

type ArticleMetadata = {
  url: string;
  description: string;
  image: string;
};

export type RunSummary = {
  checkedAt: string;
  discovered: number;
  eligible: number;
  sent: PushResult[];
  skipped: PushResult[];
  failures: PushResult[];
  publisherSourcesChecked: number;
  cityFeedsChecked: number;
  publisherSourceFailures: number;
  cityFeedFailures: number;
};

export type MonitorOptions = {
  sourceBatchSize?: number;
  maxItems?: number;
  maxAttempts?: number;
};

export type NewsStateStore = {
  get(key: string): Promise<string | null>;
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

export type MonitorEnv = {
  NEWS_STATE: NewsStateStore;
  BROKKET_API_URL: string;
  BROKKET_API_KEY?: string;
  MAX_AGE_HOURS: string;
};

const GOOGLE_NEWS = "https://news.google.com/rss/search";
const STATE_KEY = "state:last_checked_at";
const SOURCE_CURSOR_KEY = "state:source_cursor";
const LAST_RUN_KEY = "state:last_run";
const RUN_HISTORY_KEY = "state:run_history";
const LEGACY_IMAGE_RETRY = "missing_valid_exact_article_thumbnail";
const IMAGE_RETRY = "missing_valid_exact_article_thumbnail:v2";
const ROTATING_BATCH_SIZE = 20;
// Conservative local defaults; production limits are configured by GitHub Actions.
const MAX_ITEMS_PER_RUN = 4;
const MAX_ATTEMPTS_PER_RUN = 5;
const PROPERTY_TERMS = [
  "real estate", "property", "housing", "homebuyers", "homes", "flats",
  "apartments", "rera", "redevelopment", "township", "project launch",
  "land acquisition", "land parcel", "commercial lease", "office lease",
  "possession", "handover", "project completion", "construction progress",
  "building approval", "development agreement", "joint development", "developer",
  "floor space index", "fsi", "reit", "residential", "commercial project",
];
const INFRASTRUCTURE_ASSET_TERMS = [
  "metro", "ring road", "expressway", "highway", "airport", "connectivity",
  "infrastructure", "road project", "road widening", "flyover", "railway",
  "urban development", "industrial corridor", "sewer", "water supply", "master plan",
];
const DEVELOPMENT_ACTION_TERMS = [
  "construct", "construction", "reconstruct", "redevelop", "development", "project",
  "expand", "expansion", "widen", "widening", "upgrade", "modernisation", "modernization",
  "build", "building", "built", "launch", "approve", "approval", "clearance",
  "tender", "contract", "land acquisition", "foundation", "work begins", "work starts",
  "commence", "commission", "inaugurat", "opening", "completion", "phase ii", "phase 2",
  "new line", "new road", "new terminal", "new corridor", "new expressway", "new highway",
  "tunnel", "station redevelopment", "repair", "revamp", "master plan",
];
const EXCLUDED_TERMS = [
  "murder", "killed", "death", "dead body", "suicide", "crime", "arrested",
  "rape", "assault", "astrology", "celebrity", "movie", "cricket",
  "actor", "singer", "weather forecast", "rain alert", "horoscope",
  "emergency landing", "flight delay", "crash", "accident", "smuggling",
  "liquor", "monkey", "stunt", "book fair", "passenger robot",
  "vehicle dispatch", "vehicle dispatches", "carmaker", "automobile sales",
  "child safety", "pocso", "district jail", "prison inspection",
  "salesforce", "artificial intelligence", "ai deployment", "insurance",
  "insurer", "restaurant", "cafe", "food outlet", "dosa", "recipe",
  "donor heart", "ambulance", "flight schedule", "weekly flight", "no-fly day",
  "duty-free", "duty free", "digiyatra", "face recognition", "flight service",
  "flight operations", "naming airport", "name warangal airport", "reflect heritage",
  "ganeshotsav", "festival", "rains pound", "rainfall", "flood alert", "protesting",
  "protest", "injured", "booked over", "collapse at", "electoral roll", "hearing dates",
  "water samples", "theatre tax", "entertainment tax", "oil and gas", "gas discovery",
  "bribery", "bribe", "cgst officer", "vending site", "vendor at", "ligo",
  "credit rating", "ratings reaffirms", "appoints", "appointment", "chief business",
  "chief executive", "battery-swapping", "battery swapping", "instamart",
];
const QUERY_TERMS = [
  '"real estate"', "property", "housing", "RERA", "homebuyers", "redevelopment",
  "township", '"land acquisition"', '"commercial lease"', "metro", '"ring road"',
  "expressway", "highway", "airport", '"road project"', '"road widening"',
  '"project launch"', '"land parcel"', "connectivity", "infrastructure",
].join(" OR ");
const DEVELOPER_QUERY_TERMS = [
  '"project launch"', '"new project"', '"land acquisition"', '"land parcel"',
  '"joint development"', '"construction progress"', '"project update"',
  '"commercial project"', '"residential project"', '"RERA registration"',
  'possession', 'handover', '"project completion"', '"building approval"',
].join(" OR ");
const OFFICIAL_QUERY_TERMS = [
  '"press release"', '"project update"', '"construction progress"', '"land acquisition"',
  '"master plan"', '"development plan"', 'metro', 'expressway', 'highway', 'airport',
  'connectivity', 'infrastructure', 'housing', 'RERA', 'township',
].join(" OR ");

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function element(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeEntities(match[1] ?? "") : "";
}

function parseFeed(
  xml: string,
  fallbackSource: string,
  expectedDomain = "",
  cityHint?: CityPattern,
): FeedItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.map((block) => {
    const sourceTag = block.match(/<source[^>]*>/i)?.[0] ?? "";
    const sourceUrl = attribute(sourceTag, "url");
    let sourceDomain = expectedDomain;
    try {
      sourceDomain = new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      sourceDomain = expectedDomain;
    }
    return {
      title: element(block, "title").replace(/\s+-\s+[^-]+$/, "").trim(),
      link: element(block, "link"),
      publishedAt: element(block, "pubDate"),
      sourceName: element(block, "source") || fallbackSource,
      sourceDomain,
      description: element(block, "description"),
      cityHint,
    };
  }).filter((item) => {
    const sameSource = !expectedDomain
      || item.sourceDomain === expectedDomain
      || item.sourceDomain.endsWith(`.${expectedDomain}`);
    return sameSource && item.sourceDomain && item.title && item.link && item.publishedAt;
  });
}

function findCity(text: string): CityPattern | undefined {
  const normalized = ` ${text.toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ")} `;
  return CITY_PATTERNS.find((entry) =>
    entry.patterns.some((pattern) => normalized.includes(` ${pattern} `)),
  );
}

function findUnambiguousCity(text: string): CityPattern | undefined {
  const normalized = ` ${text.toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ")} `;
  const matches = CITY_PATTERNS.filter((entry) =>
    entry.patterns.some((pattern) => normalized.includes(` ${pattern} `)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function isRelevant(text: string): boolean {
  const value = text.toLocaleLowerCase("en-IN");
  if (EXCLUDED_TERMS.some((term) => value.includes(term))) return false;
  if (PROPERTY_TERMS.some((term) => value.includes(term))) return true;
  return INFRASTRUCTURE_ASSET_TERMS.some((term) => value.includes(term))
    && DEVELOPMENT_ACTION_TERMS.some((term) => value.includes(term));
}

function normalizedTitle(value: string): string {
  return value.toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function discardResponse(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The connection may already be closed; there is nothing else to release.
  }
}

function sourceAsset(url: string, sourceName: string): { name: string; logo: string } {
  const host = new URL(url).hostname.toLowerCase();
  const configured = ALL_SOURCES.find((candidate) => host === candidate.domain || host.endsWith(`.${candidate.domain}`));
  return {
    name: configured?.name ?? sourceName,
    logo: configured?.logo ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  };
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchSource(source: NewsSource, queryDays: number): Promise<FeedItem[]> {
  if (source.feed) {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "BrokketRealEstateMonitor/2.2",
        Accept: "application/rss+xml, application/xml, text/xml, */*;q=0.5",
      },
    });
    if (!response.ok) {
      await discardResponse(response);
      throw new Error(`Feed ${source.url} returned ${response.status}`);
    }
    const xml = await response.text();
    if (xml.length > 2_000_000) throw new Error(`Feed ${source.url} exceeded size limit`);
    return parseFeed(xml, source.name, source.domain);
  }
  const terms = source.type === "developer"
    ? DEVELOPER_QUERY_TERMS
    : source.type === "publisher" ? QUERY_TERMS : OFFICIAL_QUERY_TERMS;
  const sourceUrl = new URL(source.url);
  const scopedPath = sourceUrl.pathname !== "/" ? sourceUrl.pathname.replace(/\/+$/, "") : "";
  const query = `(${terms}) site:${source.domain}${scopedPath} when:${queryDays}d`;
  const url = `${GOOGLE_NEWS}?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const response = await fetch(url, {
    headers: { "User-Agent": "BrokketRealEstateMonitor/1.0" },
  });
  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`RSS ${source.domain} returned ${response.status}`);
  }
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error(`RSS ${source.domain} exceeded size limit`);
  return parseFeed(xml, source.name, source.domain);
}

function comparableUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().toLowerCase();
  } catch {
    return value.trim().toLowerCase().replace(/\/+$/, "");
  }
}

async function alreadyExistsInFeed(env: MonitorEnv, title: string, articleUrl: string): Promise<boolean> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (compatible; BrokketNewsBot/2.3; +https://brokket.com)",
  };
  if (env.BROKKET_API_KEY) headers.authorization = `Bearer ${env.BROKKET_API_KEY}`;
  const response = await fetch(`${env.BROKKET_API_URL.replace(/\/+$/, "")}/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({ page: 0, size: 50, searchQuery: title }),
  });
  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`Feed duplicate check returned ${response.status}`);
  }
  const body = await response.json() as {
    data?: { page?: { content?: Array<{ title?: string; newsLink?: string }> } };
  };
  const content = body.data?.page?.content ?? [];
  const expectedUrl = comparableUrl(articleUrl);
  const expectedTitle = normalizedTitle(title);
  return content.some((item) =>
    Boolean(item.newsLink && comparableUrl(item.newsLink) === expectedUrl)
    || Boolean(item.title && normalizedTitle(item.title) === expectedTitle),
  );
}

async function fetchCityFeed(city: CityPattern, queryDays: number): Promise<FeedItem[]> {
  const locationTerms = city.patterns.slice(0, 3).map((pattern) => `"${pattern}"`).join(" OR ");
  const query = `(${QUERY_TERMS}) (${locationTerms}) when:${queryDays}d`;
  const url = `${GOOGLE_NEWS}?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const response = await fetch(url, {
    headers: { "User-Agent": "BrokketRealEstateMonitor/2.3" },
  });
  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`City RSS ${city.code} returned ${response.status}`);
  }
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error(`City RSS ${city.code} exceeded size limit`);
  return parseFeed(xml, `${city.name} real-estate news`, "", city);
}

async function allSettledWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  task: (value: T) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      const value = values[index];
      if (value === undefined) continue;
      try {
        results[index] = { status: "fulfilled", value: await task(value) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function attribute(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"));
  return match?.[1] ? decodeEntities(match[1]) : "";
}

async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string | null> {
  const parsed = new URL(sourceUrl);
  if (parsed.hostname !== "news.google.com") return sourceUrl;
  const parts = parsed.pathname.split("/").filter(Boolean);
  const marker = parts.at(-2);
  const encodedId = parts.at(-1);
  if (!encodedId || (marker !== "articles" && marker !== "read")) return null;

  let signature = "";
  let timestamp = "";
  for (const prefix of ["articles", "rss/articles"] as const) {
    const response = await fetch(`https://news.google.com/${prefix}/${encodedId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrokketRealEstateMonitor/2.0)" },
      redirect: "follow",
    });
    if (!response.ok) {
      await discardResponse(response);
      continue;
    }
    const html = await response.text();
    signature = attribute(html, "data-n-a-sg");
    timestamp = attribute(html, "data-n-a-ts");
    if (signature && timestamp) break;
  }
  if (!signature || !timestamp) return null;

  const requestPayload = [
    "Fbv4je",
    `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${encodedId}",${timestamp},"${signature}"]`,
  ];
  const response = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "user-agent": "Mozilla/5.0 (compatible; BrokketRealEstateMonitor/2.0)",
    },
    body: `f.req=${encodeURIComponent(JSON.stringify([[requestPayload]]))}`,
  });
  if (!response.ok) {
    await discardResponse(response);
    return null;
  }
  const text = await response.text();
  const payloadLine = text.split("\n\n").find((line) => line.trim().startsWith("["));
  if (!payloadLine) return null;
  try {
    const outer = JSON.parse(payloadLine) as unknown[];
    const first = outer[0] as unknown[] | undefined;
    const encodedResult = typeof first?.[2] === "string" ? first[2] : "";
    const decoded = JSON.parse(encodedResult) as unknown[];
    const url = typeof decoded[1] === "string" ? decoded[1] : "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : null;
  } catch {
    return null;
  }
}

function metaContent(html: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}

function canonicalUrl(html: string): string {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match?.[1] ? decodeEntities(match[1]) : "";
}

function imageCandidates(html: string, baseUrl: string): string[] {
  const raw = [
    metaContent(html, "og:image"),
    metaContent(html, "og:image:url"),
    metaContent(html, "og:image:secure_url"),
    metaContent(html, "twitter:image"),
    metaContent(html, "twitter:image:src"),
    metaContent(html, "thumbnailUrl"),
  ];
  const imageSrc = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (imageSrc) raw.push(decodeEntities(imageSrc));
  for (const script of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = script[1]?.trim();
    if (!body) continue;
    try {
      const data: unknown = JSON.parse(body);
      const visit = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(visit);
        } else if (value && typeof value === "object") {
          const record = value as Record<string, unknown>;
          for (const key of ["image", "thumbnailUrl", "contentUrl", "url"]) {
            const candidate = record[key];
            if ((key === "image" || key === "thumbnailUrl" || record["@type"] === "ImageObject") && typeof candidate === "string") raw.push(candidate);
            else if (key === "image" && candidate) visit(candidate);
          }
          if (record["@graph"]) visit(record["@graph"]);
        }
      };
      visit(data);
    } catch {
      // Some publishers emit malformed JSON-LD; other metadata remains usable.
    }
  }
  return [...new Set(raw.filter(Boolean).map((value) => {
    try {
      const resolved = new URL(value, baseUrl);
      if (resolved.protocol === "http:") resolved.protocol = "https:";
      return resolved.toString();
    } catch {
      return "";
    }
  }).filter(Boolean))];
}

function isUsableImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const path = decodeURIComponent(url.pathname).toLowerCase();
    return !/(^|\/)(null|undefined)(?:[./]|$)/.test(path)
      && !/(^|[?&])(?:url|src|image)=(?:null|undefined)(?:&|$)/i.test(url.search);
  } catch {
    return false;
  }
}

async function validateThumbnail(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const response = await fetch(parsed, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BrokketRealEstateMonitor/2.1)",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      Range: "bytes=0-65535",
    },
    redirect: "follow",
  });
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!response.ok || !contentType.startsWith("image/")) {
    await discardResponse(response);
    return null;
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength < 10_000) return null;
  return response.url;
}

async function fetchArticleMetadata(item: FeedItem): Promise<ArticleMetadata | null> {
  const decodedUrl = await decodeGoogleNewsUrl(item.link);
  if (!decodedUrl) return null;
  const response = await fetch(decodedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BrokketRealEstateMonitor/1.0)" },
    redirect: "follow",
  });
  if (!response.ok) {
    await discardResponse(response);
    return null;
  }
  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > 2_000_000) {
    await discardResponse(response);
    return null;
  }
  const html = await response.text();
  if (html.length > 2_000_000) return null;
  const resolved = canonicalUrl(html) || response.url;
  const host = new URL(resolved).hostname.toLowerCase();
  if (host.endsWith("google.com")) return null;
  if (!(host === item.sourceDomain || host.endsWith(`.${item.sourceDomain}`))) return null;
  const candidates = imageCandidates(html, resolved).slice(0, 8);
  let image: string | null = null;
  for (const candidate of candidates) {
    image = await validateThumbnail(candidate);
    if (image) break;
  }
  // Some publishers reject bot-side image validation while their public OG
  // image still loads normally in the mobile app. Keep that exact article
  // image as the fallback instead of dropping an otherwise valid news item.
  if (!image) image = candidates.find(isUsableImageUrl) ?? null;
  if (!image) return null;
  return {
    url: resolved,
    description: metaContent(html, "og:description") || item.description,
    image,
  };
}

async function pushItem(env: MonitorEnv, item: FeedItem, city: CityPattern): Promise<PushResult> {
  const cleanTitle = item.title.slice(0, 300);
  const resultBase = {
    title: cleanTitle,
    cityCode: city.code,
    cityName: city.name,
    sourceName: item.sourceName,
    publishedAt: new Date(item.publishedAt).toISOString(),
  };
  const feedKey = await sha256(item.link);
  const titleKey = await sha256(normalizedTitle(cleanTitle));
  if (await env.NEWS_STATE.get(`senttitle:${titleKey}`)) {
    await env.NEWS_STATE.put(`seenfeed:${feedKey}`, "duplicate_title", { expirationTtl: 60 * 60 * 24 * 7 });
    return { ...resultBase, status: "skipped" };
  }
  let article: ArticleMetadata | null;
  try {
    article = await fetchArticleMetadata(item);
  } catch (error) {
    await env.NEWS_STATE.put(`retry:${feedKey}`, "article_metadata", { expirationTtl: 60 * 30 });
    return { ...resultBase, status: "failed", error: `article_metadata: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!article) {
    await env.NEWS_STATE.put(`retry:${feedKey}`, IMAGE_RETRY, { expirationTtl: 60 * 10 });
    return { ...resultBase, status: "failed", error: "missing_valid_exact_article_thumbnail" };
  }
  const idempotencyKey = await sha256(article.url);
  if (await env.NEWS_STATE.get(`sent:${idempotencyKey}`)) {
    await env.NEWS_STATE.put(`seenfeed:${feedKey}`, article.url, { expirationTtl: 60 * 60 * 24 * 7 });
    return { ...resultBase, status: "skipped", articleUrl: article.url };
  }
  try {
    if (await alreadyExistsInFeed(env, cleanTitle, article.url)) {
      await Promise.all([
        env.NEWS_STATE.put(`sent:${idempotencyKey}`, JSON.stringify({
          version: 2,
          url: article.url,
          title: cleanTitle,
          sentAt: new Date().toISOString(),
          isActive: true,
          recoveredFromApi: true,
        })),
        env.NEWS_STATE.put(`senttitle:${titleKey}`, article.url),
        env.NEWS_STATE.put(`seenfeed:${feedKey}`, article.url, { expirationTtl: 60 * 60 * 24 * 7 }),
      ]);
      return { ...resultBase, status: "skipped", articleUrl: article.url };
    }
  } catch (error) {
    return {
      ...resultBase,
      status: "failed",
      articleUrl: article.url,
      error: `duplicate_check: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  const description = decodeEntities(article.description).slice(0, 2_000);
  if (!isRelevant(`${cleanTitle} ${description}`)) {
    await env.NEWS_STATE.put(`seenfeed:${feedKey}`, "irrelevant_article_metadata", { expirationTtl: 60 * 60 * 24 * 7 });
    return { ...resultBase, status: "skipped", articleUrl: article.url };
  }
  const source = sourceAsset(article.url, item.sourceName);
  const payload = {
    title: cleanTitle,
    description,
    thumbnailImage: article.image,
    newsLink: article.url,
    publisherName: "Brokket News",
    publisherTagline: "Real Estate Intelligence",
    publisherLogo: "",
    sourceName: source.name.slice(0, 200),
    sourceLogo: source.logo,
    publishedAt: new Date(item.publishedAt).toISOString(),
    cityCode: city.code,
    isActive: true,
  };
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (compatible; BrokketNewsBot/2.2; +https://brokket.com)",
      "x-idempotency-key": idempotencyKey,
    };
    if (env.BROKKET_API_KEY) headers.authorization = `Bearer ${env.BROKKET_API_KEY}`;
    const response = await fetch(env.BROKKET_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    let body: { data?: { code?: string }; message?: string } = {};
    try {
      body = await response.json() as { data?: { code?: string }; message?: string };
    } catch {
      body = {};
    }
    if (!response.ok) throw new Error(`API ${response.status}: ${body.message ?? "unknown error"}`);
    const sentAt = new Date().toISOString();
    await Promise.all([
      env.NEWS_STATE.put(`sent:${idempotencyKey}`, JSON.stringify({
        version: 2,
        url: article.url,
        title: cleanTitle,
        description,
        thumbnailImage: article.image,
        apiCode: body.data?.code ?? null,
        cityCode: city.code,
        cityName: city.name,
        sourceName: source.name,
        sourceLogo: source.logo,
        publishedAt: payload.publishedAt,
        sentAt,
        isActive: true,
      })),
      env.NEWS_STATE.put(`seenfeed:${feedKey}`, article.url, { expirationTtl: 60 * 60 * 24 * 7 }),
      env.NEWS_STATE.put(`senttitle:${titleKey}`, article.url),
    ]);
    return { ...resultBase, status: "sent", code: body.data?.code, articleUrl: article.url, sourceName: source.name };
  } catch (error) {
    return { ...resultBase, status: "failed", articleUrl: article.url, error: error instanceof Error ? error.message : String(error) };
  }
}

type DailyStats = {
  date: string;
  runs: number;
  discovered: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  cities: Record<string, number>;
  sources: Record<string, number>;
  lastCheckedAt: string;
};

async function recordAnalytics(env: MonitorEnv, summary: RunSummary): Promise<void> {
  const date = summary.checkedAt.slice(0, 10);
  const dailyKey = `stats:daily:${date}`;
  const existing = await env.NEWS_STATE.get<DailyStats>(dailyKey, "json");
  const daily: DailyStats = existing ?? {
    date,
    runs: 0,
    discovered: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    cities: {},
    sources: {},
    lastCheckedAt: summary.checkedAt,
  };
  daily.runs += 1;
  daily.discovered += summary.discovered;
  daily.eligible += summary.eligible;
  daily.sent += summary.sent.length;
  daily.skipped += summary.skipped.length;
  daily.failed += summary.failures.length;
  daily.lastCheckedAt = summary.checkedAt;
  for (const item of summary.sent) {
    daily.cities[item.cityCode] = (daily.cities[item.cityCode] ?? 0) + 1;
    daily.sources[item.sourceName] = (daily.sources[item.sourceName] ?? 0) + 1;
  }

  const history = await env.NEWS_STATE.get<Array<Record<string, unknown>>>(RUN_HISTORY_KEY, "json") ?? [];
  history.push({
    checkedAt: summary.checkedAt,
    discovered: summary.discovered,
    eligible: summary.eligible,
    sent: summary.sent,
    skipped: summary.skipped.length,
    failed: summary.failures.length,
    publisherSourcesChecked: summary.publisherSourcesChecked,
    cityFeedsChecked: summary.cityFeedsChecked,
    publisherSourceFailures: summary.publisherSourceFailures,
    cityFeedFailures: summary.cityFeedFailures,
  });
  await Promise.all([
    env.NEWS_STATE.put(dailyKey, JSON.stringify(daily)),
    env.NEWS_STATE.put(RUN_HISTORY_KEY, JSON.stringify(history.slice(-500))),
  ]);
}

export async function runMonitor(env: MonitorEnv, options: MonitorOptions = {}): Promise<RunSummary> {
  const runStarted = new Date();
  const maxAgeMs = Math.max(1, Number(env.MAX_AGE_HOURS || "72")) * 60 * 60 * 1_000;
  const queryDays = Math.max(1, Math.ceil(maxAgeMs / (24 * 60 * 60 * 1_000)));
  const sourceBatchSize = Math.max(1, Math.min(
    ROTATING_SOURCES.length,
    options.sourceBatchSize ?? ROTATING_BATCH_SIZE,
  ));
  const maxItems = Math.max(1, options.maxItems ?? MAX_ITEMS_PER_RUN);
  const maxAttempts = Math.max(maxItems, options.maxAttempts ?? MAX_ATTEMPTS_PER_RUN);
  const storedCursor = Number(await env.NEWS_STATE.get(SOURCE_CURSOR_KEY) || "0");
  const cursor = Number.isFinite(storedCursor) ? storedCursor % ROTATING_SOURCES.length : 0;
  const rotating = Array.from({ length: sourceBatchSize },
    (_unused, offset) => ROTATING_SOURCES[(cursor + offset) % ROTATING_SOURCES.length])
    .filter((source): source is NewsSource => source !== undefined);
  const sources = [...CORE_SOURCES, ...rotating];
  const [feeds, cityFeeds] = await Promise.all([
    allSettledWithConcurrency(sources, 32, (source) => fetchSource(source, queryDays)),
    allSettledWithConcurrency(CITY_PATTERNS, 24, (city) => fetchCityFeed(city, queryDays)),
  ]);
  const items = [...feeds, ...cityFeeds]
    .flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const unique = new Map<string, FeedItem>();
  for (const item of items) {
    const existing = unique.get(item.link);
    if (!existing) {
      unique.set(item.link, item);
      continue;
    }
    if (!item.cityHint || existing.ambiguousCityHint) continue;
    if (!existing.cityHint) {
      existing.cityHint = item.cityHint;
    } else if (existing.cityHint.code !== item.cityHint.code) {
      existing.cityHint = undefined;
      existing.ambiguousCityHint = true;
    }
  }
  const candidates: Array<{ item: FeedItem; city: CityPattern }> = [];
  for (const item of unique.values()) {
    const published = new Date(item.publishedAt);
    if (!Number.isFinite(published.getTime())) continue;
    if (published > runStarted || runStarted.getTime() - published.getTime() > maxAgeMs) continue;
    const searchable = `${item.title} ${item.description}`;
    if (!isRelevant(searchable)) continue;
    const city = findCity(item.title)
      ?? findUnambiguousCity(item.description)
      ?? (!item.ambiguousCityHint ? item.cityHint : undefined);
    if (!city) continue;
    const feedKey = await sha256(item.link);
    const titleKey = await sha256(normalizedTitle(item.title));
    const [seen, coolingDown, sentTitle] = await Promise.all([
      env.NEWS_STATE.get(`seenfeed:${feedKey}`),
      env.NEWS_STATE.get(`retry:${feedKey}`),
      env.NEWS_STATE.get(`senttitle:${titleKey}`),
    ]);
    // Retry legacy image failures immediately after the v2 OG-image fallback
    // rollout; all current retry reasons still respect their cooldown.
    if (seen || (coolingDown && coolingDown !== LEGACY_IMAGE_RETRY) || sentTitle) continue;
    candidates.push({ item, city });
  }
  candidates.sort((a, b) => Date.parse(b.item.publishedAt) - Date.parse(a.item.publishedAt));
  const results: PushResult[] = [];
  let attempts = 0;
  let sent = 0;
  for (const candidate of candidates) {
    if (attempts >= maxAttempts || sent >= maxItems) break;
    attempts += 1;
    const result = await pushItem(env, candidate.item, candidate.city);
    results.push(result);
    if (result.status === "sent") sent += 1;
  }
  const summary = {
    checkedAt: runStarted.toISOString(),
    discovered: unique.size,
    eligible: candidates.length,
    sent: results.filter((result) => result.status === "sent"),
    skipped: results.filter((result) => result.status === "skipped"),
    failures: results.filter((result) => result.status === "failed"),
    publisherSourcesChecked: sources.length,
    cityFeedsChecked: CITY_PATTERNS.length,
    publisherSourceFailures: feeds.filter((result) => result.status === "rejected").length,
    cityFeedFailures: cityFeeds.filter((result) => result.status === "rejected").length,
  } satisfies RunSummary;
  await recordAnalytics(env, summary);
  await Promise.all([
    env.NEWS_STATE.put(STATE_KEY, runStarted.toISOString()),
    env.NEWS_STATE.put(SOURCE_CURSOR_KEY, String((cursor + rotating.length) % ROTATING_SOURCES.length)),
    env.NEWS_STATE.put(LAST_RUN_KEY, JSON.stringify({ ...summary, sources: sources.map((source) => source.name) })),
  ]);
  console.log(JSON.stringify({ event: "monitor_complete", ...summary }));
  return summary;
}
