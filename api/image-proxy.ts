const ALLOWED_IMAGE_HOSTS: Readonly<Record<string, string>> = {
  "assets.eenadu.net": "https://www.eenadu.net/",
};

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  const encoded = new URL(request.url).searchParams.get("url") || "";
  let imageUrl: URL;
  try {
    imageUrl = new URL(encoded);
  } catch {
    return Response.json({ message: "Invalid image URL" }, { status: 400 });
  }
  const referer = ALLOWED_IMAGE_HOSTS[imageUrl.hostname.toLowerCase()];
  if (imageUrl.protocol !== "https:" || !referer) {
    return Response.json({ message: "Image host is not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
        referer,
        "user-agent": "Mozilla/5.0 (compatible; BrokketImageProxy/1.0)",
      },
      redirect: "follow",
    });
    const contentType = upstream.headers.get("content-type") || "";
    const contentLength = Number(upstream.headers.get("content-length") || "0");
    if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
      await upstream.body?.cancel();
      return Response.json({ message: "Publisher image is unavailable" }, { status: 502 });
    }
    if (contentLength > 8_000_000) {
      await upstream.body?.cancel();
      return Response.json({ message: "Publisher image is too large" }, { status: 413 });
    }
    return new Response(upstream.body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json({ message: "Publisher image is temporarily unavailable" }, { status: 502 });
  }
}
