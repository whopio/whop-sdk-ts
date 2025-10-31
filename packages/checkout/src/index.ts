import { WhopPaymentRequest } from "./payment-request/whop-payment-request";
import {
	EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING,
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST,
	type WhopEmbeddedCheckoutPrefillOptions,
	type WhopEmbeddedCheckoutStyleOptions,
	type WhopEmbeddedCheckoutThemeOptions,
	getAddress,
	getEmail,
	getEmbeddedCheckoutIframeUrl,
	onWhopCheckoutMessage,
	parseSetupFutureUsage,
	setAddress,
	setEmail,
	submitCheckoutFrame,
} from "./util";

function invokeCallback<Args extends unknown[]>(
	callbackTarget?: string,
	...args: Args
) {
	if (!callbackTarget) {
		return;
	}

	const callback = (
		window as unknown as {
			[key: typeof callbackTarget]: ((...args: Args) => void) | undefined;
		}
	)[callbackTarget];
	callback?.(...args);
}

function listen(iframe: HTMLIFrameElement, node: HTMLElement) {
	window.wco?.frames.set(
		iframe,
		onWhopCheckoutMessage(iframe, function handleWhopCheckoutMessage(message) {
			switch (message.event) {
				case "resize": {
					iframe.style.height = `${message.height}px`;
					break;
				}
				case "center": {
					iframe.scrollIntoView({ block: "center", inline: "center" });
					break;
				}
				case "complete": {
					invokeCallback(
						node.dataset.whopCheckoutOnComplete,
						message.plan_id,
						message.receipt_id,
					);
					break;
				}
				case "state": {
					invokeCallback(node.dataset.whopCheckoutOnStateChange, message.state);
					break;
				}
				case "address-validation-error": {
					invokeCallback(node.dataset.whopCheckoutOnAddressValidationError, {
						error_message: message.error_message,
						error_code: message.error_code,
					});
					break;
				}
			}
		}),
	);
}

function getUtmFromCurrentUrl() {
	const searchParams = new URLSearchParams(window.location.search);
	const keys = Array.from(searchParams.keys());
	return keys.reduce((acc: Record<string, string | string[]>, key) => {
		if (!key.startsWith("utm_")) return acc;

		const values = searchParams.getAll(key);
		switch (values.length) {
			case 0: {
				return acc;
			}
			case 1: {
				acc[key] = values[0];
				break;
			}
			default: {
				acc[key] = values;
			}
		}
		return acc;
	}, {});
}

const WHOP_CHECKOUT_STYLE_PREFIX = "data-whop-checkout-style-";

function getStylesFromNode(node: HTMLElement) {
	const styles: Record<string, Record<string, string | number>> = {};
	for (const attr of node.attributes) {
		if (attr.name.startsWith(WHOP_CHECKOUT_STYLE_PREFIX)) {
			const key = attr.name.slice(WHOP_CHECKOUT_STYLE_PREFIX.length);
			const value = attr.value;
			const [componentName, ...styleAttributeParts] = key.split("-");
			if (componentName && styleAttributeParts.length > 0) {
				const styleAttribute = styleAttributeParts.reduce((acc, part, idx) => {
					if (idx === 0) return part;
					const [firstChar, ...rest] = part;
					return `${acc}${firstChar.toUpperCase()}${rest.join("")}`;
				}, "");
				styles[componentName] ??= {};
				styles[componentName][styleAttribute] = value;
			}
		}
	}

	return styles as WhopEmbeddedCheckoutStyleOptions;
}

function getThemeOptionsFromNode(node: HTMLElement) {
	const themeOptions: WhopEmbeddedCheckoutThemeOptions = {};
	if (node.dataset.whopCheckoutThemeAccentColor) {
		themeOptions.accentColor = node.dataset.whopCheckoutThemeAccentColor;
	}
	if (node.dataset.whopCheckoutThemeHighContrast) {
		themeOptions.highContrast =
			node.dataset.whopCheckoutThemeHighContrast === "true";
	}
	return themeOptions;
}

function getPrefillFromNode(node: HTMLElement) {
	const prefill: WhopEmbeddedCheckoutPrefillOptions = {};
	if (node.dataset.whopCheckoutPrefillEmail) {
		prefill.email = node.dataset.whopCheckoutPrefillEmail;
	}
	if (node.dataset.whopCheckoutPrefillName) {
		prefill.address ??= {};
		prefill.address.name = node.dataset.whopCheckoutPrefillName;
	}
	if (node.dataset.whopCheckoutPrefillAddressLine1) {
		prefill.address ??= {};
		prefill.address.line1 = node.dataset.whopCheckoutPrefillAddressLine1;
	}
	if (node.dataset.whopCheckoutPrefillAddressLine2) {
		prefill.address ??= {};
		prefill.address.line2 = node.dataset.whopCheckoutPrefillAddressLine2;
	}
	if (node.dataset.whopCheckoutPrefillAddressCity) {
		prefill.address ??= {};
		prefill.address.city = node.dataset.whopCheckoutPrefillAddressCity;
	}
	if (node.dataset.whopCheckoutPrefillAddressCountry) {
		prefill.address ??= {};
		prefill.address.country = node.dataset.whopCheckoutPrefillAddressCountry;
	}
	if (node.dataset.whopCheckoutPrefillAddressState) {
		prefill.address ??= {};
		prefill.address.state = node.dataset.whopCheckoutPrefillAddressState;
	}
	if (node.dataset.whopCheckoutPrefillAddressPostalCode) {
		prefill.address ??= {};
		prefill.address.postalCode =
			node.dataset.whopCheckoutPrefillAddressPostalCode;
	}
	return prefill;
}

function mount(node: HTMLElement) {
	if (node.dataset.whopCheckoutMounted) {
		return;
	}

	const planId = node.dataset.whopCheckoutPlanId;
	if (!planId) {
		return;
	}

	const iframeUrl = getEmbeddedCheckoutIframeUrl(
		planId,
		node.dataset.whopCheckoutTheme as "light" | "dark" | "system" | undefined,
		node.dataset.whopCheckoutSession,
		node.dataset.whopCheckoutOrigin,
		node.dataset.whopCheckoutHidePrice === "true",
		node.dataset.whopCheckoutSkipRedirect === "true" ||
			!!node.dataset.whopCheckoutOnComplete,
		node.dataset.whopCheckoutSkipUtm === "true"
			? undefined
			: getUtmFromCurrentUrl(),
		getStylesFromNode(node),
		getPrefillFromNode(node),
		getThemeOptionsFromNode(node),
		node.dataset.whopCheckoutHideSubmitButton === "true",
		node.dataset.whopCheckoutHideTos === "true",
		node.dataset.whopCheckoutHideEmail === "true",
		node.dataset.whopCheckoutDisableEmail === "true",
		node.dataset.whopCheckoutHideAddress === "true",
		node.dataset.whopCheckoutAffiliateCode,
		parseSetupFutureUsage(node.dataset.whopCheckoutSetupFutureUsage),
	);

	const iframe = document.createElement("iframe");

	iframe.src = iframeUrl;

	iframe.style.width = "100%";
	iframe.style.height = "480px";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";

	iframe.sandbox.add(...EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST);

	iframe.allow = EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING;

	node.dataset.whopCheckoutMounted = "true";

	// append iframe to the node
	node.appendChild(iframe);

	const frameIdentifier = node.id;

	if (frameIdentifier) {
		window.wco?.identifiedFrames.set(frameIdentifier, iframe);
		iframe.dataset.whopCheckoutIdentifier = frameIdentifier;
	}

	// listen for iframe events
	listen(iframe, node);
}

if (typeof window !== "undefined" && window.wco && !window.wco.listening) {
	function getFrame(identifier: string) {
		const frame = window.wco?.identifiedFrames.get(identifier);
		if (!frame)
			throw new Error(`No embed with identifier ${identifier} found.`);
		return frame;
	}
	window.wco.submit = async function submitImpl(identifier, data) {
		await submitCheckoutFrame(getFrame(identifier), data);
	};
	window.wco.getEmail = function getEmailImpl(identifier, timeout) {
		return getEmail(getFrame(identifier), timeout);
	};
	window.wco.setEmail = function setEmailImpl(identifier, email, timeout) {
		return setEmail(getFrame(identifier), email, timeout);
	};
	window.wco.getAddress = function getAddressImpl(identifier, timeout) {
		return getAddress(getFrame(identifier), timeout);
	};
	window.wco.setAddress = function setAddressImpl(
		identifier,
		address,
		timeout,
	) {
		return setAddress(getFrame(identifier), address, timeout);
	};
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof HTMLElement && node.dataset.whopCheckoutPlanId) {
					mount(node);
				}
			}
			const removedNodes = Array.from(mutation.removedNodes);
			for (const [iframe, removeListeners] of window.wco?.frames ?? []) {
				if (removedNodes.includes(iframe)) {
					if (iframe.dataset.whopCheckoutIdentifier) {
						window.wco?.identifiedFrames.delete(
							iframe.dataset.whopCheckoutIdentifier,
						);
					}
					WhopPaymentRequest.remove(iframe);
					removeListeners();
					window.wco?.frames.delete(iframe);
				}
			}
		}
	});

	for (const el of document.querySelectorAll("[data-whop-checkout-plan-id]")) {
		if (el instanceof HTMLElement) {
			mount(el);
		}
	}

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	window.wco.listening = true;
}
