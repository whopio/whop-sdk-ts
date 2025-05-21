type AwaitableParams<P extends unknown[]> = P extends [
  infer First,
  ...infer Rest
]
  ? [First | Promise<First>, ...AwaitableParams<Rest>]
  : [];

type ResultType<P extends unknown[], R> = R extends Promise<any>
  ? R
  : P extends [infer First, ...infer Rest]
  ? First extends Promise<any>
    ? Promise<R>
    : ResultType<Rest, R>
  : R;

export const withAwaitableParams = <Fn extends (...args: any[]) => unknown>(
  fn: Fn
) => {
  type Args = AwaitableParams<Parameters<Fn>>;
  return <A extends Args>(...args: A): ResultType<A, ReturnType<Fn>> => {
    const casted = args as Array<any | Promise<any>>;
    const hasPromises = casted.some((arg) => arg instanceof Promise);
    if (hasPromises) {
      return new Promise(async (resolve, reject) => {
        try {
          resolve(
            await fn(
              ...(await Promise.all(casted.map(async (arg) => await arg)))
            )
          );
        } catch (e) {
          reject(e);
        }
      }) as ResultType<A, ReturnType<Fn>>;
    }
    return fn(...args) as ResultType<A, ReturnType<Fn>>;
  };
};
