declare module "@auth/core/jwt" {
	// Extend JWT to hold the access_token (server-side only)
	interface JWT {
		accessToken?: string;
		refreshToken?: string;
	}
}

export {};
