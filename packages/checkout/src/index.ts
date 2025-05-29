interface WhopCheckoutMessage {
	event: "resize";
	height: number;
}

function isWhopCheckoutMessage(
	event: MessageEvent<unknown>,
): event is MessageEvent<WhopCheckoutMessage> {
	return (
		typeof event.data === "object" &&
		event.data !== null &&
		"event" in event.data &&
		event.data.event === "resize"
	);
}

function listen(iframe: HTMLIFrameElement) {
	window.addEventListener(
		"message",
		(event: MessageEvent<WhopCheckoutMessage | unknown>) => {
			if (event.source !== iframe.contentWindow) {
				return;
			}

			if (!isWhopCheckoutMessage(event)) {
				return;
			}

			if (event.data.event === "resize") {
				iframe.style.height = `${event.data.height}px`;
			}
		},
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

	const origin = node.dataset.whopCheckoutOrigin ?? "https://whop.com/";
	const iframeUrl = new URL(`/embedded/checkout/${planId}/`, origin);

	const theme = node.dataset.whopCheckoutTheme;
	if (theme) {
		iframeUrl.searchParams.set("theme", theme);
	}

	const windowOrigin = new URL(window.location.href).origin;
	iframeUrl.searchParams.set("h", windowOrigin);

	const iframe = document.createElement("iframe");

	iframe.src = iframeUrl.toString();

	iframe.style.width = "100%";
	iframe.style.height = "480px";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";

	iframe.sandbox.add(
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
	);

	iframe.allow =
		"document-domain; execution-while-not-rendered; execution-while-out-of-viewport; payment; paymentRequest; sync-script;";

	node.dataset.whopCheckoutMounted = "true";

	// append iframe to the node
	node.appendChild(iframe);

	// listen for height changes
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
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	for (const el of document.querySelectorAll("[data-whop-checkout-plan-id]")) {
		if (el instanceof HTMLElement) {
			mount(el);
		}
	}

	window.wco.listening = true;
}
