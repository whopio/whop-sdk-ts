export const DEFAULT_API_ORIGIN = "https://api.whop.com";

export class GQLNetworkError extends Error {
	constructor(e: unknown) {
		const message =
			e instanceof Error
				? e.message
				: typeof e === "string"
					? e
					: "Unknown network error";
		super(message);
		if (e instanceof Error) this.stack = e.stack;
	}
}

export const wrappedFetch: typeof fetch = async (...args) => {
	try {
		return await fetch(...args);
	} catch (e) {
		throw new GQLNetworkError(e);
	}
};
