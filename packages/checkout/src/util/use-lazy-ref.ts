import type { MutableRefObject } from "react";
import { useRef } from "react";

const none = Symbol("none");

export function useLazyRef<T>(fn: () => T): MutableRefObject<T> {
	const ref = useRef<T | typeof none>(none);

	if (ref.current === none) {
		ref.current = fn();
	}

	return ref as MutableRefObject<T>;
}
