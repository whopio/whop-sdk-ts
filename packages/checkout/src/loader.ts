import type { WhopCheckoutAddress, WhopCheckoutSubmitDetails } from "./types";

// get the script url from the script tag
const currentScript = document.currentScript as HTMLScriptElement;
const loaderScriptSrc = currentScript?.src;

if (typeof window !== "undefined" && loaderScriptSrc) {
	window.wco ??= (() => {
		const script = document.createElement("script");

		script.src = loaderScriptSrc.replace(/loader\.js$/, "index.js");
		script.async = true;
		script.defer = true;

		document.head.appendChild(script);

		return {
			injected: true,
			listening: false,
			frames: new Map(),
			identifiedFrames: new Map(),
			submit: (_identifier: string, _data?: WhopCheckoutSubmitDetails) => {
				throw new Error("Whop Embedded checkout script not initialized");
			},
			getEmail: (_identifier: string, _timeout = 2000) => {
				throw new Error("Whop Embedded checkout script not initialized");
			},
			setEmail: (_identifier: string, _email: string) => {
				throw new Error("Whop Embedded checkout script not initialized");
			},
			getAddress: (_identifier: string, _timeout = 2000) => {
				throw new Error("Whop Embedded checkout script not initialized");
			},
			setAddress: (_identifier: string, _address: WhopCheckoutAddress) => {
				throw new Error("Whop Embedded checkout script not initialized");
			},
		};
	})();
}
