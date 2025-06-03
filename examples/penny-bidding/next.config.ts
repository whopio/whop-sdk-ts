import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [{ hostname: "**" }],
	},
	experimental: {
		serverActions: {
			allowedOrigins: ["*.apps.whop.com"],
		},
	},
};

export default nextConfig;
