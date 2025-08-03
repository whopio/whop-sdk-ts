declare global {
	interface Window {
		wco?: {
			injected: true;
			listening: boolean;
			frames: Map<HTMLIFrameElement, () => void>;
			identifiedFrames: Map<string, HTMLIFrameElement>;
			submit: (
				identifier: string,
				data?: {
					email?: string;
				},
			) => void;
		};
	}

	interface HTMLElementEventMap {
		"checkout:submit": CustomEvent<WhopCheckoutSubmitDetails>;
	}
}

export type WhopCheckoutSubmitDetails = Record<never, never>;
