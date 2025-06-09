export type NextConfigObject = {
	experimental?: {
		serverActions?: {
			allowedOrigins?: string[];
		};
		optimizePackageImports?: string[];
	};
};
export type WhopAppOptions = {
	/**
	 * The domain ID of your whop app. Will enhance app security by ensuring that only requests from your app are allowed to access the server actions.
	 */
	domainId?: string;
};
