/**
 * Sums an array of numbers.
 * @param args The numbers to sum.
 * @returns The sum of the numbers.
 */
export function sum(...args: number[]) {
	return args.reduce((acc, curr) => acc + curr, 0);
}
