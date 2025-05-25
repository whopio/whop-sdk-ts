import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["2w3isatt1481uuygsmns.apps.whop.com"],
    },
  },
};

export default nextConfig;
