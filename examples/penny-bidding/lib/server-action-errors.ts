type WrappedServerActionResponse<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: string;
	  };

export function wrapServerAction<Args extends unknown[], Return>(
	fn: (...args: Args) => Promise<Return>,
): (...args: Args) => Promise<WrappedServerActionResponse<Return>> {
	return async (...args: Args) => {
		try {
			const data = await fn(...args);
			return { success: true, data };
		} catch (error) {
			if (error instanceof SafeError) {
				console.log("SERVER ACTION USER ERROR", error);
				return { success: false, error: error.message };
			}
			console.log("SERVER ACTION UNEXPECTED ERROR", error);
			if (error instanceof Error) {
				console.log("SERVER ACTION UNEXPECTED ERROR STACK", error.stack);
			}
			return {
				success: false,
				error: "A server error has occurred, please try again later.",
			};
		}
	};
}

export class SafeError extends Error {}

export function unwrapServerAction<T>(
	input: WrappedServerActionResponse<T>,
): T {
	if (input.success) {
		return input.data;
	}
	throw new Error(input.error);
}
