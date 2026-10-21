import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Pin Turbopack's root to this project so it ignores the stray
  // /Users/markbathie/package-lock.json one directory up.
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["mongoose", "bcrypt"],
  // Images are resized by the CDN they come from (src/lib/image-loader.ts),
  // not by Next's built-in optimiser, which keeps sharp out of server memory.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // "/home" isn't a route — the marketing homepage lives at "/". Alias it
      // so bookmarks/autocomplete/old links land on the homepage, not a 404.
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
