import {
	WhopCheckoutGetAddressError,
	WhopCheckoutSetAddressError,
	WhopCheckoutSetEmailError,
} from "./errors";
import {
	type PaymentRequestCreateResult,
	type PaymentRequestUpdateResult,
	type SubmitRequest,
	type WhopCheckoutMessage,
	type WhopCheckoutState,
	isWhopCheckoutMessage,
} from "./messages";
import { WhopPaymentRequest } from "./payment-request/whop-payment-request";
import { rpc } from "./rpc";
import type { WhopCheckoutAddress, WhopCheckoutSubmitDetails } from "./types";
import { uuidv4Safe } from "./uuid-v4";

const HOST_SCRIPT_VERSION = 1;

export { isWhopCheckoutMessage };

export type { WhopCheckoutMessage, WhopCheckoutState };

export function onWhopCheckoutMessage(
	iframe: HTMLIFrameElement,
	callback: (
		message: Exclude<
			WhopCheckoutMessage,
			Extract<
				WhopCheckoutMessage,
				{
					event:
						| "payment-request-create-request"
						| "payment-request-update-request";
				}
			>
		>,
	) => void,
) {
	function handleMessage(event: MessageEvent<WhopCheckoutMessage | unknown>) {
		if (event.source !== iframe.contentWindow) {
			return;
		}

		if (!isWhopCheckoutMessage(event)) {
			return;
		}

		switch (event.data.event) {
			case "payment-request-create-request": {
				try {
					const paymentRequest = WhopPaymentRequest.create(
						iframe,
						event.data.method_data,
						event.data.details,
						event.data.options,
					);
					const createResult: PaymentRequestCreateResult = {
						__scope: "whop-embedded-checkout",
						event: "payment-request-create-result",
						event_id: event.data.event_id,
						ok: true,
						id: paymentRequest.id,
					};
					const origin = new URL(iframe.src).origin;
					iframe.contentWindow?.postMessage(createResult, origin);
				} catch (error) {
					const createResult: PaymentRequestCreateResult = {
						__scope: "whop-embedded-checkout",
						event: "payment-request-create-result",
						event_id: event.data.event_id,
						ok: false,
						error: error instanceof Error ? error.message : "Unknown error",
					};
					const origin = new URL(iframe.src).origin;
					iframe.contentWindow?.postMessage(createResult, origin);
				}

				return;
			}

			case "payment-request-update-request": {
				if ("active" in event.data && typeof event.data.active === "boolean") {
					WhopPaymentRequest.setActive(iframe, event.data.active);
				}
				try {
					const paymentRequest = WhopPaymentRequest.get(iframe);
					if (!paymentRequest) {
						throw new Error("Payment request not found");
					}
					if ("method_data" in event.data && event.data.method_data) {
						paymentRequest.updateMethodData(event.data.method_data);
					}
					if ("details" in event.data && event.data.details) {
						paymentRequest.updateDetails(event.data.details);
					}
					if ("options" in event.data && event.data.options) {
						paymentRequest.updateOptions(event.data.options);
					}
					const updateResult: PaymentRequestUpdateResult = {
						__scope: "whop-embedded-checkout",
						event: "payment-request-update-result",
						event_id: event.data.event_id,
						ok: true,
					};
					const origin = new URL(iframe.src).origin;
					iframe.contentWindow?.postMessage(updateResult, origin);
				} catch (error) {
					const updateResult: PaymentRequestUpdateResult = {
						__scope: "whop-embedded-checkout",
						event: "payment-request-update-result",
						event_id: event.data.event_id,
						ok: false,
						error: error instanceof Error ? error.message : "Unknown error",
					};
					const origin = new URL(iframe.src).origin;
					iframe.contentWindow?.postMessage(updateResult, origin);
				}

				return;
			}
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

export async function setAddress(
	frame: HTMLIFrameElement,
	address: WhopCheckoutAddress,
	timeout = 2000,
) {
	return rpc(
		frame,
		{ event: "set-address", address },
		"set-address-result",
		(message) => {
			if (message.ok) return;
			throw new WhopCheckoutSetAddressError(message.error);
		},
		timeout,
	);
}

export async function getAddress(frame: HTMLIFrameElement, timeout = 2000) {
	return rpc(
		frame,
		{ event: "get-address" },
		"get-address-result",
		(message) => {
			if (!message.ok) throw new WhopCheckoutGetAddressError(message.error);
			return {
				address: message.address,
				isComplete: message.is_complete,
			};
		},
		timeout,
	);
}

export async function submitCheckoutFrame(
	frame: HTMLIFrameElement,
	_data?: WhopCheckoutSubmitDetails,
) {
	const submitRequest: SubmitRequest = {
		__scope: "whop-embedded-checkout",
		event: "submit",
		event_id: uuidv4Safe(),
	};

	const paymentRequest = WhopPaymentRequest.get(frame);
	if (paymentRequest?.active) {
		const paymentRequestResult = await paymentRequest.getResult();
		submitRequest.payment_request_result = paymentRequestResult;
	}

	const origin = new URL(frame.src).origin;
	frame.contentWindow?.postMessage(submitRequest, origin);
}

export function parseSetupFutureUsage(val?: string) {
	if (val === "off_session") return "off_session" as const;
	return undefined;
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
	address?: Partial<WhopCheckoutAddress>;
}

export interface WhopEmbeddedCheckoutThemeOptions {
	accentColor?: string;
	highContrast?: boolean;
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
	hideAddressForm?: boolean,
	affiliateCode?: string,
	setupFutureUsage?: "off_session",
) {
	const iframeUrl = new URL(
		`/embedded/checkout/${planId}/`,
		origin ?? "https://whop.com/",
	);

	iframeUrl.searchParams.set("h", window.location.origin);
	iframeUrl.searchParams.set("v", HOST_SCRIPT_VERSION.toString());

	try {
		let currentParent: Window = window;
		while (currentParent.parent !== currentParent) {
			currentParent = currentParent.parent;
		}
		const topLevelHost = currentParent.location.hostname;
		if (currentParent.location.protocol === "https:" && topLevelHost) {
			iframeUrl.searchParams.set("t", topLevelHost);
		}
	} catch {
		// ignore cross origin and other errors
	}

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
	if (hideAddressForm) {
		iframeUrl.searchParams.set("address.hidden", "1");
	}
	if (affiliateCode) {
		iframeUrl.searchParams.set("a", affiliateCode);
	}
	if (setupFutureUsage) {
		iframeUrl.searchParams.set("setup_future_usage", setupFutureUsage);
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
	if (prefill?.address?.name) {
		iframeUrl.searchParams.set("name", prefill.address.name);
	}
	if (prefill?.address?.line1) {
		iframeUrl.searchParams.set("address.line1", prefill.address.line1);
	}
	if (prefill?.address?.line2) {
		iframeUrl.searchParams.set("address.line2", prefill.address.line2);
	}
	if (prefill?.address?.city) {
		iframeUrl.searchParams.set("address.city", prefill.address.city);
	}
	if (prefill?.address?.country) {
		iframeUrl.searchParams.set("address.country", prefill.address.country);
	}
	if (prefill?.address?.state) {
		iframeUrl.searchParams.set("address.state", prefill.address.state);
	}
	if (prefill?.address?.postalCode) {
		iframeUrl.searchParams.set(
			"address.postal_code",
			prefill.address.postalCode,
		);
	}
	if (themeOptions) {
		for (const [optionName, optionValue] of Object.entries(themeOptions) as [
			string,
			string | boolean | undefined,
		][]) {
			if (optionValue)
				iframeUrl.searchParams.set(
					`theme.${optionName}`,
					typeof optionValue === "boolean" ? "1" : optionValue,
				);
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
