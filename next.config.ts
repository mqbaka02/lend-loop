import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      new URL("https://placehold.co/**"),
      new URL("https://img.clerk.com/**"),
      new URL("https://**.convex.cloud/**")
    ],
  },
  allowedDevOrigins: ['192.168.88.254']
};

export default nextConfig;
