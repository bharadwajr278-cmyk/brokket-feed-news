const FEED_ORIGIN = "http://13.126.103.246";
const MEDIA_ORIGIN = "https://www.brokket.app";

const ALLOWED_ROUTES = [
  /^\/api\/feed-news$/,
  /^\/api\/feed-news\/list$/,
  /^\/api\/feed-news\/NEWS-[A-Za-z0-9_-]+$/,
  /^\/admin\/api\/projects\/photos$/,
];

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "OPTIONS"]);

export const config = { runtime: "edge" };

function safeEqual(left: string, right: string): boolean {
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export default async function handler(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const path = incomingUrl.searchParams.get("path") || "";

  if (!ALLOWED_METHODS.has(request.method)) {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }
  if (!ALLOWED_ROUTES.some((pattern) => pattern.test(path))) {
    return Response.json({ message: "Route not allowed" }, { status: 403 });
  }

  const panelToken = request.headers.get("X-PANEL-TOKEN") || "";
  const expectedPanelToken = process.env.PANEL_ACCESS_TOKEN || "";
  if (!expectedPanelToken || !safeEqual(panelToken, expectedPanelToken)) {
    return Response.json({ message: "Invalid admin access token" }, { status: 401 });
  }

  const headers = new Headers();
  const isMediaRoute = path.startsWith("/admin/api/");
  const accessToken = isMediaRoute ? process.env.BROKKET_ACCESS_TOKEN : undefined;
  const contentType = request.headers.get("content-type");
  if (accessToken) headers.set("ACCESS_TOKEN", accessToken);
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");

  try {
    const upstream = await fetch(`${isMediaRoute ? MEDIA_ORIGIN : FEED_ORIGIN}${path}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "OPTIONS"
        ? undefined
        : await request.arrayBuffer(),
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    responseHeaders.set("cache-control", "no-store");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: "Brokket API is temporarily unavailable" }, { status: 502 });
  }
}
