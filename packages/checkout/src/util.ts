import type { WhopCheckoutSubmitDetails } from "./types";

export type WhopCheckoutState = "loading" | "ready" | "disabled";

export type WhopCheckoutMessage =
	| {
			event: "resize";
			height: number;
	  }
	| {
			event: "center";
	  }
	| {
			event: "complete";
			receipt_id?: string;
			plan_id: string;
	  }
	| {
			event: "state";
			state: WhopCheckoutState;
	  }
	| {
			event: "get-email-result";
			email: string;
			event_id: string;
	  };

const EVENT_TYPES = [
	"resize",
	"center",
	"complete",
	"state",
	"get-email-result",
] as const;
type WhopCheckoutEventType = WhopCheckoutMessage["event"];

export function isWhopCheckoutMessage(
	event: MessageEvent<unknown>,
): event is MessageEvent<WhopCheckoutMessage> {
	return (
		typeof event.data === "object" &&
		event.data !== null &&
		"event" in event.data &&
		EVENT_TYPES.includes(event.data.event as WhopCheckoutEventType)
	);
}

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

const HEX_CACHE: string[] = [];

function byteToHex(b: number): string {
	// biome-ignore lint/suspicious/noAssignInExpressions: not sus, if you cant read this stop using javascript <3
	return HEX_CACHE[b] || (HEX_CACHE[b] = (b + 256).toString(16).slice(1));
}

export function uuidv4Safe(): string {
	const bytes = new Uint8Array(16);

	if (
		typeof crypto !== "undefined" &&
		typeof crypto.getRandomValues === "function"
	) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < 16; i++) {
			bytes[i] = (Math.random() * 256) | 0;
		}
	}

	// Per RFC 4122 §4.4 — set version & variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return (
		// biome-ignore lint/style/useTemplate: do disagree
		byteToHex(bytes[0]) +
		byteToHex(bytes[1]) +
		byteToHex(bytes[2]) +
		byteToHex(bytes[3]) +
		"-" +
		byteToHex(bytes[4]) +
		byteToHex(bytes[5]) +
		"-" +
		byteToHex(bytes[6]) +
		byteToHex(bytes[7]) +
		"-" +
		byteToHex(bytes[8]) +
		byteToHex(bytes[9]) +
		"-" +
		byteToHex(bytes[10]) +
		byteToHex(bytes[11]) +
		byteToHex(bytes[12]) +
		byteToHex(bytes[13]) +
		byteToHex(bytes[14]) +
		byteToHex(bytes[15])
	);
}

export function getCheckoutEmail(frame: HTMLIFrameElement, timeout = 2000) {
	const origin = new URL(frame.src).origin;
	const eventId = uuidv4Safe();
	frame.contentWindow?.postMessage(
		{
			__scope: "whop-embedded-checkout",
			event: "get-email",
			event_id: eventId,
		},
		origin,
	);

	return new Promise<string>((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error("Timeout waiting for email"));
			window.removeEventListener("message", handleMessage);
		}, timeout);

		const handleMessage = (
			event: MessageEvent<WhopCheckoutMessage | unknown>,
		) => {
			if (event.source !== frame.contentWindow) return;
			if (!isWhopCheckoutMessage(event)) return;
			if (event.data.event !== "get-email-result") return;
			if (event.data.event_id !== eventId) return;
			clearTimeout(timeoutId);
			resolve(event.data.email);
			window.removeEventListener("message", handleMessage);
		};

		window.addEventListener("message", handleMessage);
	});
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

type InferredWhopCheckoutEventType = (typeof EVENT_TYPES)[number];

// if you understand this type hack you should consider working at Whop!
// https://whop.com/careers
const _: WhopCheckoutEventType extends InferredWhopCheckoutEventType
	? InferredWhopCheckoutEventType extends WhopCheckoutEventType
		? true
		: false
	: false = true;
