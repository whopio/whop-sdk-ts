declare global {
	interface Window {
		wco?: {
			injected: true;
			listening: boolean;
		};
	}
}

export {};
