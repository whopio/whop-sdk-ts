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

export class GQLRequestError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
	}

	isUnauthorized() {
		return this.statusCode === 401;
	}

	isForbidden() {
		return this.statusCode === 403;
	}

	isNotFound() {
		return this.statusCode === 404;
	}

	isServerError() {
		return this.statusCode >= 500;
	}
}

export class GQLError extends Error {
	errors: { message: string }[];

	constructor(errors: { message: string }[]) {
		super(errors[0].message);
		this.errors = errors;
	}
}

export async function graphqlFetch<R, V>(
	url: URL | string,
	operationId: string,
	variables?: V,
	headersInit: HeadersInit = {},
): Promise<R> {
	try {
		const body = {
			operationId,
			variables,
		};

		const headers = new Headers(headersInit);
		headers.set("Content-Type", "application/json");
		headers.set("Accept", "application/json");

		const response = await fetch(url, {
			method: "POST",
			body: JSON.stringify(body),
			headers,
		});

		if (!response.ok) {
			const errorMessage = await response.text();
			throw new GQLRequestError(response.status, errorMessage);
		}

		const data = await response.json();
		if (data.errors) {
			throw new GQLError(data.errors);
		}

		return data.data;
	} catch (e) {
		throw new GQLNetworkError(e);
	}
}
