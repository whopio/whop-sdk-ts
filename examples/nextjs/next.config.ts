import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [{ hostname: "**" }],
	},
};

export default withWhopAppConfig(nextConfig, {
	domainId: "nu01g614bry5v6sw6uko",
});
