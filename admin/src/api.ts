export type NewsItem = {
  id: string;
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
  cityCode: string;
  publishedAt: string;
  dateCreated: string;
  dateUpdated: string;
  likeCount: number;
  commentCount: number;
  engagementShareCount: number;
  repostCount: number;
  viewCount: number;
};

export type NewsDraft = Omit<NewsItem,
  "id" | "code" | "dateCreated" | "dateUpdated" | "likeCount" |
  "commentCount" | "engagementShareCount" | "repostCount" | "viewCount"
>;

export type NewsFilters = {
  page: number;
  size: number;
  searchQuery?: string;
  isActive?: boolean;
  cityCode?: string;
  sourceName?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type PageResult = {
  content: NewsItem[];
  page: number;
  totalPages: number;
  totalElements: number;
};

type ApiEnvelope<T> = {
  data?: T | { data?: T };
  message?: string;
  code?: string;
};

const TOKEN_KEY = "feed_admin_access_token";
const ADMIN_PROPERTY_TERMS = [
  "real estate", "property", "housing", "homebuyers", "homes", "flats",
  "apartments", "rera", "redevelopment", "township", "project launch",
  "land acquisition", "land parcel", "commercial lease", "office lease",
  "possession", "handover", "project completion", "construction progress",
  "building approval", "development agreement", "joint development", "developer",
  "floor space index", "fsi", "reit", "residential", "commercial project",
];
const ADMIN_INFRASTRUCTURE_TERMS = [
  "metro", "ring road", "expressway", "highway", "airport", "connectivity",
  "infrastructure", "road project", "road widening", "flyover", "railway",
  "urban development", "industrial corridor", "sewer", "water supply", "master plan",
];
const ADMIN_DEVELOPMENT_ACTION_TERMS = [
  "construct", "construction", "reconstruct", "redevelop", "development", "project",
  "expand", "expansion", "widen", "widening", "upgrade", "modernisation", "modernization",
  "build", "building", "built", "launch", "approve", "approval", "clearance",
  "tender", "contract", "land acquisition", "foundation", "work begins", "work starts",
  "commence", "commission", "inaugurat", "opening", "completion", "phase ii", "phase 2",
  "new line", "new road", "new terminal", "new corridor", "new expressway", "new highway",
  "tunnel", "station redevelopment", "repair", "revamp", "master plan",
];
const ADMIN_EXCLUDED_TERMS = [
  "salesforce", "ai deployment", "property insurance", "insurer", "insurance rates",
  "restaurant", "cafe", "food outlet", "dosa", "recipe", "donor heart", "ambulance",
  "flight schedule", "weekly flight", "no-fly day",
  "duty-free", "duty free", "digiyatra", "face recognition", "flight service",
  "flight operations", "naming airport", "name warangal airport", "reflect heritage",
  "ganeshotsav", "festival", "rains pound", "rainfall", "flood alert", "protesting",
  "protest", "injured", "booked over", "collapse at", "electoral roll", "hearing dates",
  "water samples", "theatre tax", "entertainment tax", "oil and gas", "gas discovery",
  "bribery", "bribe", "cgst officer", "vending site", "vendor at", "ligo",
  "credit rating", "ratings reaffirms", "appoints", "appointment", "chief business",
  "chief executive", "battery-swapping", "battery swapping", "instamart",
  "ed raid", "enforcement directorate", "pet dog", "dog bites", "police file fir",
];

export function hasAdminToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getAdminToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function validateAdminToken(token: string): Promise<void> {
  const path = "/api/feed-news/list";
  const requestPath = import.meta.env.DEV
    ? path
    : `/api/proxy?path=${encodeURIComponent(path)}`;
  const response = await fetch(requestPath, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-PANEL-TOKEN": token.trim(),
    },
    body: JSON.stringify({ page: 0, size: 1 }),
  });
  if (response.ok) return;
  const body = await response.json().catch(() => ({})) as { message?: string };
  if (response.status === 401 || response.status === 403) {
    throw new Error("Invalid admin access token");
  }
  throw new Error(body.message || "Unable to verify access token");
}

async function api<T>(method: string, path: string, data?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const requestPath = import.meta.env.DEV
    ? path
    : `/api/proxy?path=${encodeURIComponent(path)}`;
  const response = await fetch(requestPath, {
    method,
    headers: {
      ...(data instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(token ? { "X-PANEL-TOKEN": token } : {}),
    },
    body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>;
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  const outer = body.data;
  if (outer && typeof outer === "object" && "data" in outer) return (outer as { data: T }).data;
  return (outer ?? body) as T;
}

export async function listNews(filters: NewsFilters): Promise<PageResult> {
  const { sourceName, createdFrom, createdTo, isActive, ...request } = filters;
  if (sourceName && !request.searchQuery) request.searchQuery = sourceName;

  const fetchPage = async (pageNumber: number, size: number): Promise<PageResult> => {
    const response = await api<unknown>("POST", "/api/feed-news/list", {
      ...request,
      page: pageNumber,
      size,
    });
    return normalisePage(response, pageNumber);
  };

  // Fetch the complete matching set so duplicate API rows can be collapsed and
  // date/status filters remain correct even when two copies disagree on status.
  const batchSize = 200;
  const first = await fetchPage(0, batchSize);
  const pages = [first];
  const safePageCount = Math.min(first.totalPages, 100);
  for (let pageNumber = 1; pageNumber < safePageCount; pageNumber += 1) {
    pages.push(await fetchPage(pageNumber, batchSize));
  }

  const unique = new Map<string, NewsItem>();
  pages.flatMap((page) => page.content).forEach((item) => {
    const key = duplicateKey(item);
    const existing = unique.get(key);
    if (!existing || preferItem(item, existing)) unique.set(key, item);
  });
  const filtered = [...unique.values()].filter((item) => {
    const searchable = `${item.title} ${item.description}`.toLowerCase();
    if (ADMIN_EXCLUDED_TERMS.some((term) => searchable.includes(term))) return false;
    const isPropertyNews = ADMIN_PROPERTY_TERMS.some((term) => searchable.includes(term));
    const isDevelopmentNews = ADMIN_INFRASTRUCTURE_TERMS.some((term) => searchable.includes(term))
      && ADMIN_DEVELOPMENT_ACTION_TERMS.some((term) => searchable.includes(term));
    if (!isPropertyNews && !isDevelopmentNews) return false;
    if (sourceName && item.sourceName !== sourceName) return false;
    if (isActive !== undefined && item.isActive !== isActive) return false;
    const dateKey = publishedDateKey(item.publishedAt);
    if (createdFrom && (!dateKey || dateKey < createdFrom)) return false;
    if (createdTo && (!dateKey || dateKey > createdTo)) return false;
    return true;
  }).sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());

  const start = filters.page * filters.size;
  return {
    content: filtered.slice(start, start + filters.size),
    page: filters.page,
    totalPages: Math.ceil(filtered.length / filters.size),
    totalElements: filtered.length,
  };
}

function duplicateKey(item: NewsItem): string {
  if (item.newsLink) {
    try {
      const url = new URL(item.newsLink);
      url.hash = "";
      url.search = "";
      url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return `url:${url.toString().toLowerCase()}`;
    } catch {
      // Fall through to the title key for malformed legacy URLs.
    }
  }
  const title = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `title:${title}|${item.cityCode}|${publishedDateKey(item.publishedAt)}`;
}

function preferItem(candidate: NewsItem, current: NewsItem): boolean {
  if (candidate.isActive !== current.isActive) return candidate.isActive;
  return new Date(candidate.dateUpdated || candidate.dateCreated).getTime()
    > new Date(current.dateUpdated || current.dateCreated).getTime();
}

function publishedDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function normalisePage(response: unknown, requestedPage: number): PageResult {
  const candidate = response && typeof response === "object" && "page" in response
    ? (response as { page: unknown }).page
    : response;
  if (Array.isArray(candidate)) {
    const content = candidate as NewsItem[];
    return { content, page: requestedPage, totalPages: 1, totalElements: content.length };
  }
  const page = candidate as Partial<PageResult> & { number?: number };
  const rawContent = Array.isArray(page.content) ? page.content : [];
  return {
    content: rawContent,
    page: page.page ?? page.number ?? requestedPage,
    totalPages: page.totalPages ?? 0,
    totalElements: page.totalElements ?? 0,
  };
}

function toWritePayload(draft: NewsDraft): Record<string, unknown> {
  return {
    title: draft.title,
    description: draft.description,
    isActive: draft.isActive,
    newsLink: draft.newsLink || null,
    thumbnailImage: draft.thumbnailImage || null,
    publisherName: draft.publisherName || "Brokket News",
    publisherTagline: draft.publisherTagline || "Real Estate Intelligence",
    publisherLogo: draft.publisherLogo || "",
    sourceName: draft.sourceName,
    sourceLogo: draft.sourceLogo || "",
    publishedAt: new Date(draft.publishedAt).toISOString(),
    cityCode: draft.cityCode,
  };
}

export function createNews(draft: NewsDraft): Promise<unknown> {
  return api("POST", "/api/feed-news", toWritePayload(draft));
}

export function updateNews(code: string, draft: NewsDraft): Promise<unknown> {
  return api("PUT", `/api/feed-news/${encodeURIComponent(code)}`, toWritePayload(draft));
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const response = await api<unknown>("POST", "/admin/api/projects/photos", form);
  const urls = Array.isArray(response) ? response : [];
  if (typeof urls[0] !== "string") throw new Error("Upload completed without an image URL");
  return urls[0];
}
