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

export function hasAdminToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
  const { sourceName, ...request } = filters;
  if (sourceName && !request.searchQuery) request.searchQuery = sourceName;
  const response = await api<unknown>("POST", "/api/feed-news/list", request);
  const candidate = response && typeof response === "object" && "page" in response
    ? (response as { page: unknown }).page
    : response;
  if (Array.isArray(candidate)) {
    const content = sourceName
      ? (candidate as NewsItem[]).filter((item) => item.sourceName === sourceName)
      : candidate as NewsItem[];
    return { content, page: filters.page, totalPages: 1, totalElements: content.length };
  }
  const page = candidate as Partial<PageResult> & { number?: number };
  const rawContent = Array.isArray(page.content) ? page.content : [];
  const content = sourceName
    ? rawContent.filter((item) => item.sourceName === sourceName)
    : rawContent;
  return {
    content,
    page: page.page ?? page.number ?? filters.page,
    totalPages: page.totalPages ?? 0,
    totalElements: sourceName ? content.length : page.totalElements ?? 0,
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
