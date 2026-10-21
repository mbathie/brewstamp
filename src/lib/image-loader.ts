// next/image loader (see next.config.ts). Resizing happens at the image CDN
// instead of in our server: Next's built-in optimiser loads sharp/libvips,
// which cost ~50 MB of server memory to re-resize photos Unsplash and Pexels
// already serve at any width. Local images in public/ are pre-sized and served
// as they are.
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("https://images.unsplash.com/") || src.startsWith("https://images.pexels.com/")) {
    const url = new URL(src);
    const oldW = Number(url.searchParams.get("w"));
    const oldH = Number(url.searchParams.get("h"));
    url.searchParams.set("w", String(width));
    // Keep a cropped image's aspect ratio when it has a fixed height.
    if (oldW && oldH) url.searchParams.set("h", String(Math.round((oldH * width) / oldW)));
    url.searchParams.set("q", String(quality || Number(url.searchParams.get("q")) || 70));
    return url.toString();
  }
  // Next requires the loader to use the width; static files ignore the query.
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
