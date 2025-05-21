export function sum(...args: number[]) {
  return args.reduce((acc, curr) => acc + curr, 0);
}
