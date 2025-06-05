import { useSyncExternalStore } from "use-sync-external-store/shim";

function subscribe() {
	return () => {};
}

export function useIsHydrated() {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}
