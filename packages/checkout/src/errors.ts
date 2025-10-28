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

export class WhopCheckoutRpcAbortedError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutRpcAbortedError";
	constructor(message?: string) {
		super(message ?? "Aborted waiting for embed response");
	}
}

export function isWhopCheckoutRpcAbortedError(
	error: unknown,
): error is WhopCheckoutRpcAbortedError {
	return error instanceof WhopCheckoutRpcAbortedError;
}

export class WhopCheckoutSetEmailError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutSetEmailError";
}

export function isWhopCheckoutSetEmailError(
	error: unknown,
): error is WhopCheckoutSetEmailError {
	return error instanceof WhopCheckoutSetEmailError;
}

export class WhopCheckoutSetAddressError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutSetAddressError";
}

export function isWhopCheckoutSetAddressError(
	error: unknown,
): error is WhopCheckoutSetAddressError {
	return error instanceof WhopCheckoutSetAddressError;
}

export class WhopCheckoutGetAddressError extends WhopCheckoutError {
	public readonly name = "WhopCheckoutGetAddressError";
}

export function isWhopCheckoutGetAddressError(
	error: unknown,
): error is WhopCheckoutGetAddressError {
	return error instanceof WhopCheckoutGetAddressError;
}
