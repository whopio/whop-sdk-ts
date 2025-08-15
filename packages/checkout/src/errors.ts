export class WhopCheckoutError extends Error {
	public readonly type = "WhopCheckoutError";
}

export function isWhopCheckoutError(
	error: unknown,
): error is WhopCheckoutError {
	return error instanceof WhopCheckoutError;
}

export class WhopCheckoutRpcTimeoutError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutRpcTimeoutError";
	constructor(message?: string) {
		super(message ?? "Timeout waiting for embed response");
	}
}

export function isWhopCheckoutRpcTimeoutError(
	error: unknown,
): error is WhopCheckoutRpcTimeoutError {
	return error instanceof WhopCheckoutRpcTimeoutError;
}

export class WhopCheckoutSetEmailError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutSetEmailError";
}

export function isWhopCheckoutSetEmailError(
	error: unknown,
): error is WhopCheckoutSetEmailError {
	return error instanceof WhopCheckoutSetEmailError;
}
