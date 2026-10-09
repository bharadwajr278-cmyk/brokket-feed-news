import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  CirclePower, ExternalLink, FilePenLine, ImagePlus, Link2, LoaderCircle,
  LogOut, MailCheck, MapPin, Newspaper, Plus, RefreshCw, Search, SlidersHorizontal, Trash2, X,
} from "lucide-react";
import { CITY_PATTERNS, publisherNameForCity, type CityPattern } from "../../src/cities";
import { ALL_SOURCES, type NewsSource } from "../../src/sources";
import {
  clearAdminToken, createNews, getAdminToken, hasAdminToken, listNews, listReraMailHistory, setAdminToken,
  updateNews, uploadImage, validateAdminToken, type NewsDraft, type NewsFilters, type NewsItem, type ReraMailItem,
} from "./api";

const emptyDraft = (): NewsDraft => ({
  title: "",
  description: "",
  isActive: true,
  newsLink: "",
  thumbnailImage: "",
  publisherName: "",
  publisherTagline: "Real Estate Intelligence",
  publisherLogo: "",
  sourceName: "",
  sourceLogo: "",
  cityCode: "",
  publishedAt: new Date().toISOString().slice(0, 16),
});

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

function dateGroupKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function dateGroupLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

function cityFromSearch(value: string): CityPattern | undefined {
  const query = value.trim().toLowerCase();
  if (!query) return undefined;
  return CITY_PATTERNS.find((city) =>
    city.name.toLowerCase() === query ||
    city.code.toLowerCase() === query ||
    city.patterns.some((pattern) => pattern.toLowerCase() === query),
  );
}

function TokenGate({ onReady }: { onReady: () => void }) {
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  return <main className="login-shell">
    <form className="login-card" onSubmit={async (event) => {
      event.preventDefault();
      if (!token.trim()) return;
      try {
        setChecking(true);
        setError("");
        await validateAdminToken(token);
        setAdminToken(token);
        onReady();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to verify access token");
      } finally {
        setChecking(false);
      }
    }}>
      <div className="brand-mark"><img src="/brokket-b-mark.png" alt="Brokket" /></div>
      <p className="eyebrow">BROKKET ADMIN</p>
      <h1>Brokket Feed News</h1>
      <p className="muted">Use the separate Feed admin access token. It stays only in this browser and is never committed to Git.</p>
      {error && <div className="alert login-alert">{error}</div>}
      <label>Admin access token<input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste admin token" autoFocus /></label>
      <button className="primary wide" type="submit" disabled={checking}>{checking && <LoaderCircle className="spin" />}{checking ? "Verifying…" : "Connect securely"}</button>
    </form>
  </main>;
}

type EditorProps = {
  item: NewsItem | null;
  onClose: () => void;
  onSaved: () => void;
};

function NewsEditor({ item, onClose, onSaved }: EditorProps) {
  const [draft, setDraft] = useState<NewsDraft>(() => item ? {
    title: item.title || "", description: item.description || "", isActive: item.isActive,
    newsLink: item.newsLink || "", thumbnailImage: item.thumbnailImage || "",
    publisherName: publisherNameForCity(item.cityCode), publisherTagline: item.publisherTagline || "Real Estate Intelligence",
    publisherLogo: item.publisherLogo || "", sourceName: item.sourceName || "", sourceLogo: item.sourceLogo || "",
    cityCode: item.cityCode || "",
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  } : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"thumbnailImage" | "sourceLogo" | "publisherLogo" | null>(null);
  const [error, setError] = useState("");

  const patch = <K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const doUpload = async (field: "thumbnailImage" | "sourceLogo" | "publisherLogo", file?: File) => {
    if (!file) return;
    try {
      setUploading(field);
      patch(field, await uploadImage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };
  const submit = async () => {
    if (!draft.title.trim()) return setError("Title is required");
    if (!draft.cityCode) return setError("City is required");
    try {
      setSaving(true);
      setError("");
      if (item) await updateNews(item.code, draft); else await createNews(draft);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save news");
    } finally {
      setSaving(false);
    }
  };
  const selectCity = (code: string) => {
    setDraft((current) => ({
      ...current,
      cityCode: code,
      publisherName: code ? publisherNameForCity(code) : "",
    }));
  };
  const selectSource = (name: string) => {
    const source = ALL_SOURCES.find((candidate) => candidate.name === name);
    setDraft((current) => ({ ...current, sourceName: name, sourceLogo: source?.logo || current.sourceLogo }));
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="editor-modal" role="dialog" aria-modal="true" aria-label={item ? "Edit news article" : "Add news article"}>
      <header><div><p className="eyebrow">NEWS MANAGEMENT</p><h2>{item ? "Edit news article" : "Add news article"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></header>
      <div className="editor-scroll">
        {error && <div className="alert">{error}</div>}
        <fieldset><legend>Basic information</legend>
          <label className="full">Title *<input value={draft.title} onChange={(e) => patch("title", e.target.value)} /></label>
          <label className="full">Description<textarea rows={5} value={draft.description} onChange={(e) => patch("description", e.target.value)} /></label>
          <label className="full">News link (URL)<div className="input-icon"><Link2 /><input type="url" value={draft.newsLink} onChange={(e) => patch("newsLink", e.target.value)} /></div></label>
        </fieldset>
        <fieldset><legend>Publisher & location</legend>
          <label>Source name<input list="source-options" value={draft.sourceName} onChange={(e) => selectSource(e.target.value)} placeholder="Select or enter source" /></label>
          <datalist id="source-options">{ALL_SOURCES.map((source) => <option key={`${source.name}-${source.url}`} value={source.name} />)}</datalist>
          <label>City *<select value={draft.cityCode} onChange={(e) => selectCity(e.target.value)}><option value="">Select city</option>{CITY_PATTERNS.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></label>
          <label>Published date & time<input type="datetime-local" value={draft.publishedAt} onChange={(e) => patch("publishedAt", e.target.value)} /></label>
          <label>Publisher name<input value={draft.cityCode ? publisherNameForCity(draft.cityCode) : "Select a city first"} readOnly /></label>
          <label>Publisher tagline<input value={draft.publisherTagline} onChange={(e) => patch("publisherTagline", e.target.value)} /></label>
          <label className="toggle-field"><span>Article status</span><button type="button" className={`switch ${draft.isActive ? "on" : ""}`} onClick={() => patch("isActive", !draft.isActive)}><span />{draft.isActive ? "Active" : "Inactive"}</button></label>
        </fieldset>
        <fieldset><legend>Media</legend>
          <MediaField label="Thumbnail image" value={draft.thumbnailImage} loading={uploading === "thumbnailImage"} onChange={(value) => patch("thumbnailImage", value)} onUpload={(file) => doUpload("thumbnailImage", file)} />
          <MediaField label="Source logo" value={draft.sourceLogo} loading={uploading === "sourceLogo"} onChange={(value) => patch("sourceLogo", value)} onUpload={(file) => doUpload("sourceLogo", file)} />
          <MediaField label="Publisher logo" value={draft.publisherLogo} loading={uploading === "publisherLogo"} onChange={(value) => patch("publisherLogo", value)} onUpload={(file) => doUpload("publisherLogo", file)} />
        </fieldset>
      </div>
      <footer><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving || Boolean(uploading)} onClick={submit}>{saving && <LoaderCircle className="spin" />}{item ? "Update article" : "Create article"}</button></footer>
    </section>
  </div>;
}

function MediaField({ label, value, loading, onChange, onUpload }: { label: string; value: string; loading: boolean; onChange: (value: string) => void; onUpload: (file?: File) => void }) {
  const id = `upload-${label.replace(/\s/g, "-").toLowerCase()}`;
  return <div className="media-field"><label>{label}</label>
    <label className="upload-box" htmlFor={id}>{loading ? <LoaderCircle className="spin" /> : <ImagePlus />} {loading ? "Uploading…" : `Upload ${label}`}</label>
    <input id={id} className="sr-only" type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
    <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste image URL" />
    {value && <div className="media-preview"><img src={displayImageUrl(value)} alt="Preview" /><span>{label} ready</span><button onClick={() => onChange("")} aria-label={`Remove ${label}`}><Trash2 /></button></div>}
  </div>;
}

function SourcesPanel() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const sources = useMemo(() => ALL_SOURCES.filter((source) => {
    const haystack = `${source.name} ${source.domain} ${source.type} ${source.language} ${source.cityCode || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (type === "all" || source.type === type);
  }), [query, type]);
  const types = [...new Set(ALL_SOURCES.map((source) => source.type))];
  return <>
    <section className="toolbar source-toolbar"><div className="search-control"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search source or domain…" /></div><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All source types</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></section>
    <div className="source-summary"><strong>{sources.length}</strong> of {ALL_SOURCES.length} monitored sources</div>
    <section className="source-grid">{sources.map((source) => <SourceCard key={`${source.name}-${source.url}`} source={source} />)}</section>
  </>;
}

function SourceCard({ source }: { source: NewsSource }) {
  const cityName = source.cityCode ? CITY_PATTERNS.find((city) => city.code === source.cityCode)?.name : "";
  return <article className="source-card"><div className="source-logo"><img src={source.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /><Building2 /></div><div className="source-copy"><div><h3>{source.name}</h3><span className={`type-badge ${source.type}`}>{source.type}</span></div><p>{source.domain}</p><div className="source-meta"><span>{source.language.toUpperCase()}</span>{cityName && <span>{cityName} city edition</span>}</div><div className="source-status"><CheckCircle2 /> Monitored every 20 minutes</div></div><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.name}`}><ExternalLink /></a></article>;
}

function displayImageUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() === "assets.eenadu.net") {
      return `/api/image-proxy?url=${encodeURIComponent(url.toString())}`;
    }
  } catch {
    return value;
  }
  return value;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }).format(date);
}

function ReraMailPanel() {
  const [projects, setProjects] = useState<ReraMailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const history = await listReraMailHistory();
      setProjects(history.projects);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load RERA mail history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  const cities = useMemo(() => [...new Set(projects.map((item) => item.city).filter(Boolean))].sort(), [projects]);
  const filtered = useMemo(() => projects.filter((item) => {
    const searchable = `${item.project_name} ${item.rera_number} ${item.developer} ${item.city} ${item.source}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase()) && (city === "all" || item.city === city);
  }), [city, projects, query]);
  const priorityCount = projects.filter((item) => /gurugram|gurgaon|faridabad|noida|gautam buddha/i.test(`${item.city} ${item.location}`)).length;
  const latest = projects[0]?.sent_at;

  return <>
    <section className="stats rera-stats">
      <article><span>Emails successfully sent</span><strong>{projects.length.toLocaleString("en-IN")}</strong><MailCheck /></article>
      <article><span>Priority-city alerts</span><strong>{priorityCount.toLocaleString("en-IN")}</strong><MapPin /></article>
      <article><span>Latest email</span><strong className="latest-mail-time">{latest ? formatDateTime(latest) : "No alerts yet"}</strong><CalendarDays /></article>
    </section>
    <section className="toolbar rera-toolbar">
      <div className="search-control"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project, RERA number or builder…" /></div>
      <select value={city} onChange={(e) => setCity(e.target.value)}><option value="all">All emailed cities</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <button className="icon-button refresh" onClick={loadHistory} aria-label="Refresh RERA mail history"><RefreshCw className={loading ? "spin" : ""} /></button>
    </section>
    {error && <div className="alert">{error}</div>}
    <section className="rera-card">
      <div className="rera-table-head"><span>Project</span><span>RERA number</span><span>City</span><span>Email sent</span><span>Source</span></div>
      {loading && projects.length === 0 ? <div className="empty"><LoaderCircle className="spin" />Loading sent-mail history…</div>
        : filtered.length === 0 ? <div className="empty"><MailCheck />{projects.length === 0 ? "No real new-project email has been sent yet." : "No emailed project matches these filters."}</div>
        : filtered.map((item) => <article className="rera-row" key={item.id}>
          <div className="rera-project"><strong>{item.project_name}</strong><span>{item.developer || "Builder not available"}</span>{item.official_url && <a href={item.official_url} target="_blank" rel="noreferrer">Official RERA record <ExternalLink /></a>}</div>
          <code>{item.rera_number || "—"}</code>
          <div><strong>{item.city || "Unknown"}</strong><span>{item.registration_date || "Registration date unavailable"}</span></div>
          <div><span className="mail-sent-badge"><MailCheck /> Sent</span><time>{formatDateTime(item.sent_at)}</time></div>
          <span className="rera-source">{item.source}</span>
        </article>)}
      <footer className="rera-footer">Showing {filtered.length.toLocaleString("en-IN")} of {projects.length.toLocaleString("en-IN")} successfully emailed projects</footer>
    </section>
  </>;
}

export function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuthentication, setCheckingAuthentication] = useState(hasAdminToken());
  const [view, setView] = useState<"news" | "sources" | "rera">("news");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [editor, setEditor] = useState<{ open: boolean; item: NewsItem | null }>({ open: false, item: null });
  const [filters, setFilters] = useState({ search: "", status: "active", city: "", source: "", from: "", to: "" });

  useEffect(() => {
    const storedToken = getAdminToken();
    if (!storedToken) {
      setCheckingAuthentication(false);
      return;
    }
    validateAdminToken(storedToken)
      .then(() => setAuthenticated(true))
      .catch(() => clearAdminToken())
      .finally(() => setCheckingAuthentication(false));
  }, []);

  const load = useCallback(async () => {
    if (!authenticated) return;
    try {
      setLoading(true); setError("");
      const request: NewsFilters = { page, size: 20 };
      const matchedCity = cityFromSearch(filters.search);
      if (filters.search.trim() && (!matchedCity || filters.city)) request.searchQuery = filters.search.trim();
      if (filters.status !== "all") request.isActive = filters.status === "active";
      if (filters.city) request.cityCode = filters.city;
      else if (matchedCity) request.cityCode = matchedCity.code;
      if (filters.source) request.sourceName = filters.source;
      if (filters.from) request.createdFrom = filters.from;
      if (filters.to) request.createdTo = filters.to;
      const result = await listNews(request);
      setItems(result.content); setTotalPages(result.totalPages); setTotal(result.totalElements);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load news");
    } finally { setLoading(false); }
  }, [authenticated, filters, page]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const dateGroups = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: NewsItem[] }> = [];
    for (const item of items) {
      const key = dateGroupKey(item.publishedAt);
      const current = groups.at(-1);
      if (!current || current.key !== key) groups.push({ key, label: dateGroupLabel(item.publishedAt), items: [item] });
      else current.items.push(item);
    }
    return groups;
  }, [items]);
  const setFilter = (key: keyof typeof filters, value: string) => { setPage(0); setFilters((current) => ({ ...current, [key]: value })); };
  const toggle = async (item: NewsItem) => {
    const next = !item.isActive;
    if (!next && !window.confirm(`Deactivate “${item.title}”? It will stop showing in the app.`)) return;
    try {
      await updateNews(item.code, { ...item, isActive: next });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Status update failed"); }
  };

  if (checkingAuthentication) return <main className="login-shell"><div className="auth-check"><LoaderCircle className="spin" /><strong>Verifying secure access…</strong></div></main>;
  if (!authenticated) return <TokenGate onReady={() => setAuthenticated(true)} />;
  const viewTitle = view === "news" ? "News management" : view === "sources" ? "Source directory" : "RERA mail history";
  const viewDescription = view === "news" ? "Review, edit and control every article shown in the Brokket app." : view === "sources" ? "Every publisher, developer and official channel monitored by automation." : "Only new RERA projects successfully emailed to your account.";
  return <div className="app-shell">
    <aside><div className="logo"><span><img src="/brokket-b-mark.png" alt="Brokket" /></span><strong>Brokket Feed News</strong></div><nav><button className={view === "news" ? "active" : ""} onClick={() => setView("news")}><Newspaper />News</button><button className={view === "sources" ? "active" : ""} onClick={() => setView("sources")}><Activity />Sources</button><button className={view === "rera" ? "active" : ""} onClick={() => setView("rera")}><MailCheck />RERA mail history</button></nav><div className="aside-foot"><div><strong>20 min</strong><span>Automation cycle</span></div><button className="icon-button" aria-label="Log out" onClick={() => { clearAdminToken(); setAuthenticated(false); }}><LogOut /></button></div></aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">BROKKET FEED NEWS</p><h1>{viewTitle}</h1><p>{viewDescription}</p></div>{view === "news" && <button className="primary" onClick={() => setEditor({ open: true, item: null })}><Plus />Add news</button>}</header>
      {view !== "rera" && <section className="stats"><article><span>Total results</span><strong>{total.toLocaleString("en-IN")}</strong><Newspaper /></article><article><span>Configured cities</span><strong>{CITY_PATTERNS.length}</strong><Building2 /></article><article><span>Monitored sources</span><strong>{ALL_SOURCES.length}</strong><Activity /></article></section>}
      {view !== "rera" && <div className="view-tabs"><button className={view === "news" ? "active" : ""} onClick={() => setView("news")}>Feed news</button><button className={view === "sources" ? "active" : ""} onClick={() => setView("sources")}>All sources <span>{ALL_SOURCES.length}</span></button></div>}
      {view === "rera" ? <ReraMailPanel /> : view === "sources" ? <SourcesPanel /> : <>
        <section className="toolbar">
          <div className="search-control"><Search /><input value={filters.search} onChange={(e) => setFilter("search", e.target.value)} placeholder="Search title, city or author…" /></div>
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <select value={filters.city} onChange={(e) => setFilter("city", e.target.value)}><option value="">All {CITY_PATTERNS.length} cities</option>{CITY_PATTERNS.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select>
          <select value={filters.source} onChange={(e) => setFilter("source", e.target.value)}><option value="">All sources</option>{ALL_SOURCES.map((source) => <option key={`${source.name}-${source.url}`} value={source.name}>{source.name}</option>)}</select>
          <div className="date-range"><label className="date-control"><span>From</span><CalendarDays /><input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} /></label><span className="date-dash">—</span><label className="date-control"><span>To</span><CalendarDays /><input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} /></label></div>
          <button className="icon-button refresh" onClick={load} aria-label="Refresh"><RefreshCw className={loading ? "spin" : ""} /></button>
        </section>
        {error && <div className="alert">{error}</div>}
        <section className="news-card">
          <div className="table-head"><span>Image</span><span>Title</span><span>City</span><span>Source</span><span>Published</span><span>Status</span><span>Actions</span></div>
          {loading && items.length === 0 ? <div className="empty"><LoaderCircle className="spin" />Loading news…</div> : items.length === 0 ? <div className="empty"><SlidersHorizontal />No news matches these filters.</div> : dateGroups.map((group) => <div className="date-group" key={group.key}>
            <div className="date-group-heading"><CalendarDays /><strong>{group.label}</strong><span>{group.items.length} {group.items.length === 1 ? "news" : "news items"} on this page</span></div>
            {group.items.map((item) => <article className="news-row" key={item.id}>
            <div className="thumb">{item.thumbnailImage ? <img src={displayImageUrl(item.thumbnailImage)} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <Newspaper />}</div>
            <div className="news-title"><strong>{item.title}</strong>{item.newsLink && <a href={item.newsLink} target="_blank" rel="noreferrer"><Link2 />{item.newsLink}</a>}</div>
            <span className="city-pill">{CITY_PATTERNS.find((city) => city.code === item.cityCode)?.name || item.cityCode || "—"}</span>
            <div className="publisher">{item.sourceLogo ? <img src={item.sourceLogo} alt="" /> : <Building2 />}<span>{item.sourceName || "Unknown source"}</span></div>
            <time>{displayDate(item.publishedAt)}</time>
            <button className={`status ${item.isActive ? "active" : "inactive"}`} onClick={() => toggle(item)}><CirclePower />{item.isActive ? "Active" : "Inactive"}</button>
            <div className="actions"><button className="icon-button" onClick={() => setEditor({ open: true, item })} aria-label="Edit"><FilePenLine /></button><button className="icon-button danger" onClick={() => item.isActive && toggle(item)} aria-label="Deactivate" disabled={!item.isActive}><Trash2 /></button></div>
            </article>)}
          </div>)}
          <footer className="pagination"><span>Showing {items.length} of {total.toLocaleString("en-IN")}</span><div><button disabled={page <= 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button><span>Page {page + 1} of {Math.max(totalPages, 1)}</span><button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></button></div></footer>
        </section>
      </>}
    </main>
    {editor.open && <NewsEditor item={editor.item} onClose={() => setEditor({ open: false, item: null })} onSaved={() => { setEditor({ open: false, item: null }); load(); }} />}
  </div>;
}
