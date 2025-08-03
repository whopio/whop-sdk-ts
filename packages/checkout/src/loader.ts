import type { WhopCheckoutSubmitDetails } from "./types";

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
			submit: (identifier: string, data?: WhopCheckoutSubmitDetails) => {
				const frame = window.wco?.identifiedFrames.get(identifier);
				if (!frame)
					throw new Error(
						`Failed to submit Whop embedded checkout. No frame with identifier ${identifier} found.`,
					);
				frame.dispatchEvent(
					new CustomEvent("checkout:submit", {
						detail: data,
						cancelable: true,
						bubbles: false,
						composed: true,
					}),
				);
			},
		};
	})();
}
