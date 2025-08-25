/**
 * Web-safe wrapper for react-native-haptic-feedback.
 * - Lazily imports the native module only in native environments.
 * - Provides a no-op fallback on web to avoid runtime crashes.
 */

type HapticType =
	| "selection"
	| "impactLight"
	| "impactMedium"
	| "impactHeavy"
	| "notificationSuccess"
	| "notificationWarning"
	| "notificationError";

type HapticOptions = {
	enableVibrateFallback?: boolean;
	ignoreAndroidSystemSettings?: boolean;
};

// Singleton holder for the native module once loaded
let nativeModule: {
	trigger: (type: HapticType, options?: HapticOptions) => void;
} | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureNativeLoaded(): Promise<void> {
	// If on web, skip loading entirely
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore - process may not be typed in RN web builds
	const isWeb =
		typeof document !== "undefined" && typeof window !== "undefined";
	if (isWeb) return;

	if (nativeModule || loadingPromise) {
		return loadingPromise ?? Promise.resolve();
	}

	loadingPromise = import("react-native-haptic-feedback")
		.then((mod) => {
			nativeModule = { trigger: mod.default.trigger };
		})
		.catch(() => {
			// Keep nativeModule null; fall back to noop
		})
		.finally(() => {
			loadingPromise = null;
		});

	return loadingPromise;
}

const HAPTIC_NOOP = {
	trigger: (_type: HapticType, _options?: HapticOptions) => {
		// no-op on web
	},
};

const Haptics = {
	async trigger(type: HapticType, options?: HapticOptions): Promise<void> {
		await ensureNativeLoaded();
		if (nativeModule) {
			try {
				nativeModule.trigger(type, options);
			} catch {
				// ignore
			}
			return;
		}
		HAPTIC_NOOP.trigger(type, options);
	},
};

export default Haptics;
