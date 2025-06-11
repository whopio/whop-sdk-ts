import {
	EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING,
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST,
	getEmbeddedCheckoutIframeUrl,
	onWhopCheckoutMessage,
} from "./util";

function listen(iframe: HTMLIFrameElement) {
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
			}
		}),
	);
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
	listen(iframe);
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
