declare global {
	interface Window {
		wco?: {
			injected: true;
			listening: boolean;
			frames: Map<HTMLIFrameElement, () => void>;
			identifiedFrames: Map<string, HTMLIFrameElement>;
			submit: (identifier: string, data?: WhopCheckoutSubmitDetails) => void;
			getEmail: (identifier: string, timeout?: number) => Promise<string>;
			setEmail: (
				identifier: string,
				email: string,
				timeout?: number,
			) => Promise<void>;
			getAddress: (
				identifier: string,
				timeout?: number,
			) => Promise<{
				address: WhopCheckoutAddress;
				isComplete: boolean;
			}>;
			setAddress: (
				identifier: string,
				address: WhopCheckoutAddress,
				timeout?: number,
			) => Promise<void>;
		};
	}

	interface HTMLElementEventMap {
		"checkout:submit": CustomEvent<WhopCheckoutSubmitDetails>;
	}
}

export type WhopCheckoutSubmitDetails = Record<never, never>;

export type WhopCheckoutAddress = {
	name: string;
	country: string;
	line1: string;
	line2?: string;
	city: string;
	state: string;
	postalCode: string;
};
