declare global {
	interface Window {
		wco?: {
			injected: true;
			listening: boolean;
			frames: Map<HTMLIFrameElement, () => void>;
		};
	}
}

export {};
