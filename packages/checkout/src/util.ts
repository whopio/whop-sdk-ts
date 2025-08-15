import { WhopCheckoutSetEmailError } from "./errors";
import {
	type WhopCheckoutMessage,
	type WhopCheckoutState,
	isWhopCheckoutMessage,
} from "./messages";
import { rpc } from "./rpc";
import type { WhopCheckoutSubmitDetails } from "./types";

export { isWhopCheckoutMessage };

export type { WhopCheckoutMessage, WhopCheckoutState };

export function onWhopCheckoutMessage(
	iframe: HTMLIFrameElement,
	callback: (message: WhopCheckoutMessage) => void,
) {
	function handleMessage(event: MessageEvent<WhopCheckoutMessage | unknown>) {
		if (event.source !== iframe.contentWindow) {
			return;
		}

		if (!isWhopCheckoutMessage(event)) {
			return;
		}

		callback(event.data);
	}

	window.addEventListener("message", handleMessage);

	return () => {
		window.removeEventListener("message", handleMessage);
	};
}

export async function setEmail(
	frame: HTMLIFrameElement,
	email: string,
	timeout = 2000,
) {
	return rpc(
		frame,
		{ event: "set-email", email },
		"set-email-result",
		(message) => {
			if (message.ok) return;
			throw new WhopCheckoutSetEmailError(message.error);
		},
		timeout,
	);
}

export async function getEmail(frame: HTMLIFrameElement, timeout = 2000) {
	return rpc(
		frame,
		{ event: "get-email" },
		"get-email-result",
		(message) => message.email,
		timeout,
	);
}

export function submitCheckoutFrame(
	frame: HTMLIFrameElement,
	_data?: WhopCheckoutSubmitDetails,
) {
	const origin = new URL(frame.src).origin;
	frame.contentWindow?.postMessage(
		{
			__scope: "whop-embedded-checkout",
			event: "submit",
		},
		origin,
	);
}

export type { WhopCheckoutSubmitDetails };

export interface WhopEmbeddedCheckoutStyleOptions {
	container?: {
		paddingTop?: number | string;
		paddingBottom?: number | string;
		paddingY?: number | string;
	};
}

export interface WhopEmbeddedCheckoutPrefillOptions {
	email?: string;
}

export interface WhopEmbeddedCheckoutThemeOptions {
	accentColor?: string;
}

export function getEmbeddedCheckoutIframeUrl(
	planId: string,
	theme?: "light" | "dark" | "system",
	sessionId?: string,
	origin?: string,
	hidePrice?: boolean,
	skipRedirect?: boolean,
	utm?: Record<string, string | string[]>,
	styles?: WhopEmbeddedCheckoutStyleOptions,
	prefill?: WhopEmbeddedCheckoutPrefillOptions,
	themeOptions?: WhopEmbeddedCheckoutThemeOptions,
	hideSubmitButton?: boolean,
	hideTermsAndConditions?: boolean,
	hideEmail?: boolean,
	disableEmail?: boolean,
) {
	const iframeUrl = new URL(
		`/embedded/checkout/${planId}/`,
		origin ?? "https://whop.com/",
	);

	iframeUrl.searchParams.set("h", window.location.origin);

	if (theme) {
		iframeUrl.searchParams.set("theme", theme);
	}
	if (sessionId) {
		iframeUrl.searchParams.set("session", sessionId);
	}
	if (hidePrice) {
		iframeUrl.searchParams.set("hide_price", "true");
	}
	if (skipRedirect) {
		iframeUrl.searchParams.set("skip_redirect", "true");
	}
	if (hideSubmitButton) {
		iframeUrl.searchParams.set("hide_submit_button", "true");
	}
	if (hideTermsAndConditions) {
		iframeUrl.searchParams.set("hide_tos", "true");
	}
	if (hideEmail) {
		iframeUrl.searchParams.set("email.hidden", "1");
	}
	if (disableEmail) {
		iframeUrl.searchParams.set("email.disabled", "1");
	}
	if (utm) {
		for (const [key, value] of Object.entries(utm).sort((a, b) =>
			a[0].localeCompare(b[0]),
		)) {
			if (!key.startsWith("utm_")) continue;
			if (Array.isArray(value)) {
				for (const v of value) {
					iframeUrl.searchParams.append(key, v);
				}
			} else {
				iframeUrl.searchParams.set(key, value);
			}
		}
	}
	if (styles) {
		for (const [component, componentStyles] of Object.entries(styles) as [
			string,
			Record<string, string | number> | undefined,
		][]) {
			if (componentStyles) {
				for (const [styleAttribute, styleValue] of Object.entries(
					componentStyles,
				)) {
					iframeUrl.searchParams.set(
						`style.${component}.${styleAttribute}`,
						styleValue.toString(),
					);
				}
			}
		}
	}
	if (prefill?.email) {
		iframeUrl.searchParams.set("email", prefill.email);
	}
	if (themeOptions) {
		for (const [optionName, optionValue] of Object.entries(themeOptions) as [
			string,
			string | undefined,
		][]) {
			if (optionValue)
				iframeUrl.searchParams.set(`theme.${optionName}`, optionValue);
		}
	}
	return iframeUrl.toString();
}

export const EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST = [
	"allow-forms",
	"allow-modals",
	"allow-orientation-lock",
	"allow-pointer-lock",
	"allow-popups",
	"allow-presentation",
	"allow-same-origin",
	"allow-scripts",
	"allow-top-navigation",
	"allow-top-navigation-by-user-activation",
	"allow-downloads",
];

export const EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING =
	"document-domain; execution-while-not-rendered; execution-while-out-of-viewport; payment; paymentRequest; sync-script;";
