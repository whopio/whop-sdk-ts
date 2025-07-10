import {
	EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING,
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST,
	type WhopEmbeddedCheckoutPrefillOptions,
	type WhopEmbeddedCheckoutStyleOptions,
	type WhopEmbeddedCheckoutThemeOptions,
	getEmbeddedCheckoutIframeUrl,
	onWhopCheckoutMessage,
} from "./util";

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
					const callbackTarget = node.dataset.whopCheckoutOnComplete;
					if (callbackTarget) {
						const callback = (
							window as unknown as {
								[key: typeof callbackTarget]:
									| ((plan_id: string, receipt_id?: string) => void)
									| undefined;
							}
						)[callbackTarget];
						callback?.(message.plan_id, message.receipt_id);
					}
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
	return themeOptions;
}

function getPrefillFromNode(node: HTMLElement) {
	const prefill: WhopEmbeddedCheckoutPrefillOptions = {};
	if (node.dataset.whopCheckoutPrefillEmail) {
		prefill.email = node.dataset.whopCheckoutPrefillEmail;
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

	// listen for iframe events
	listen(iframe, node);
}

if (typeof window !== "undefined" && window.wco && !window.wco.listening) {
	// observe the DOM an element with the `data-whop-checkout-plan-id` data attribute
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof HTMLElement && node.dataset.whopCheckoutPlanId) {
					mount(node);
				}
			}
			const removedNodes = Array.from(mutation.removedNodes);
			for (const [iframe, cleanup] of window.wco?.frames ?? []) {
				if (removedNodes.includes(iframe)) {
					cleanup();
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
