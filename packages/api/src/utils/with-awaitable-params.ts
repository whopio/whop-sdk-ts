type AwaitableParams<P extends unknown[]> = P extends [
	infer First,
	...infer Rest,
]
	? [First | Promise<First>, ...AwaitableParams<Rest>]
	: [];

// biome-ignore lint/suspicious/noExplicitAny: required for type inference
type ResultType<P extends unknown[], R> = R extends Promise<any>
	? R
	: P extends [infer First, ...infer Rest]
		? // biome-ignore lint/suspicious/noExplicitAny: required for type inference
			First extends Promise<any>
			? Promise<R>
			: ResultType<Rest, R>
		: R;

/**
 * A utility function that makes a function's parameters awaitable.
 * @param fn The function to enhance.
 * @returns The function with awaitable parameters.
 */
// biome-ignore lint/suspicious/noExplicitAny: required for type inference
export const withAwaitableParams = <Fn extends (...args: any[]) => unknown>(
	fn: Fn,
) => {
	type Args = AwaitableParams<Parameters<Fn>>;
	return <A extends Args>(...args: A): ResultType<A, ReturnType<Fn>> => {
		// biome-ignore lint/suspicious/noExplicitAny: required for type inference
		const casted = args as Array<any | Promise<any>>;
		const hasPromises = casted.some((arg) => arg instanceof Promise);
		if (hasPromises) {
			return new Promise((resolve, reject) => {
				return Promise.all(casted)
					.then((args) => {
						return fn(...args);
					})
					.then(resolve)
					.catch(reject);
			}) as ResultType<A, ReturnType<Fn>>;
		}
		return fn(...args) as ResultType<A, ReturnType<Fn>>;
	};
};
