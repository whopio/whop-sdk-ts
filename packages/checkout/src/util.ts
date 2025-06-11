export type WhopCheckoutMessage =
	| {
			event: "resize";
			height: number;
	  }
	| {
			event: "center";
	  };

export function isWhopCheckoutMessage(
	event: MessageEvent<unknown>,
): event is MessageEvent<WhopCheckoutMessage> {
	return (
		typeof event.data === "object" &&
		event.data !== null &&
		"event" in event.data &&
		(event.data.event === "resize" || event.data.event === "center")
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

export function getEmbeddedCheckoutIframeUrl(
	planId: string,
	theme?: "light" | "dark" | "system",
	sessionId?: string,
	origin?: string,
	hidePrice?: boolean,
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
