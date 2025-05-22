import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [{ hostname: "**" }],
	},
	experimental: {
		serverActions: {
			allowedOrigins: ["nu01g614bry5v6sw6uko.apps.whop.com"],
		},
	},
};

export default nextConfig;
