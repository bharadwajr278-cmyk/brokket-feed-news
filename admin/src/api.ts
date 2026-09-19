export type NewsItem = {
  id: string;
  code?: string;
  title: string;
  description: string;
  isActive: boolean;
  newsLink: string;
  thumbnailImage: string;
  postedBy: string;
  postedByLogo: string;
  cityCode: string;
  cityName: string;
  createdAt: string;
};

export type NewsDraft = Omit<NewsItem, "id" | "code">;

export type NewsFilters = {
  page: number;
  size: number;
  searchQuery?: string;
  isActive?: boolean;
  cityCode?: string;
  postedBy?: string;
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

const TOKEN_KEY = "admin_access_token";

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
  const response = await fetch(path, {
    method,
    headers: {
      ...(data instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
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
  const response = await api<unknown>("POST", "/api/more-pages/news/list", filters);
  const candidate = response && typeof response === "object" && "page" in response
    ? (response as { page: unknown }).page
    : response;
  if (Array.isArray(candidate)) {
    return { content: candidate as NewsItem[], page: filters.page, totalPages: 1, totalElements: candidate.length };
  }
  const page = candidate as Partial<PageResult> & { number?: number };
  return {
    content: Array.isArray(page.content) ? page.content : [],
    page: page.page ?? page.number ?? filters.page,
    totalPages: page.totalPages ?? 0,
    totalElements: page.totalElements ?? 0,
  };
}

function toWritePayload(draft: NewsDraft, includeCreatedAt: boolean): Record<string, unknown> {
  return {
    title: draft.title,
    description: draft.description,
    isActive: draft.isActive,
    newsLink: draft.newsLink || null,
    thumbnailImage: draft.thumbnailImage || null,
    postedBy: draft.postedBy,
    postedByLogo: draft.postedByLogo || null,
    cityCode: draft.cityCode,
    ...(includeCreatedAt ? { createdAt: new Date(draft.createdAt) } : {}),
  };
}

export function createNews(draft: NewsDraft): Promise<unknown> {
  return api("POST", "/api/more-pages/news", toWritePayload(draft, true));
}

export function updateNews(id: string, draft: NewsDraft): Promise<unknown> {
  return api("PUT", `/api/more-pages/news/${encodeURIComponent(id)}`, toWritePayload(draft, false));
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const response = await api<unknown>("POST", "/admin/api/projects/photos", form);
  const urls = Array.isArray(response) ? response : [];
  if (typeof urls[0] !== "string") throw new Error("Upload completed without an image URL");
  return urls[0];
}
