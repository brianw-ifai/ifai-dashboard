import type { NextConfig } from "next";

// NEXT_PUBLIC_PAGES_REPO publishes the same build under another repo's Pages site (the dashboard-v2 preview).
const repo = process.env.NEXT_PUBLIC_PAGES_REPO || "ifai-dashboard";
const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? {
        output: "export",
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
