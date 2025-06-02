export function getReactNativePostMessage() {
	const reactNativePostMessage =
		typeof window !== "undefined" &&
		"ReactNativeWebView" in window &&
		typeof window.ReactNativeWebView === "object" &&
		window.ReactNativeWebView &&
		"postMessage" in window.ReactNativeWebView &&
		typeof window.ReactNativeWebView.postMessage === "function"
			? (data: string) => {
					if (
						typeof window !== "undefined" &&
						"ReactNativeWebView" in window &&
						typeof window.ReactNativeWebView === "object" &&
						window.ReactNativeWebView &&
						"postMessage" in window.ReactNativeWebView &&
						typeof window.ReactNativeWebView.postMessage === "function"
					)
						window?.ReactNativeWebView?.postMessage(data);
				}
			: undefined;
	return reactNativePostMessage;
}

export function getSwiftPostMessage() {
	const swiftMessageHandler =
		typeof window !== "undefined" &&
		"webkit" in window &&
		typeof window.webkit === "object" &&
		window.webkit !== null &&
		"messageHandlers" in window.webkit &&
		typeof window.webkit.messageHandlers === "object" &&
		window.webkit.messageHandlers !== null &&
		"SwiftWebView" in window.webkit.messageHandlers &&
		typeof window.webkit.messageHandlers.SwiftWebView === "object" &&
		window.webkit.messageHandlers.SwiftWebView !== null &&
		"postMessage" in window.webkit.messageHandlers.SwiftWebView
			? window.webkit.messageHandlers.SwiftWebView
			: null;

	const swiftPostMessage = swiftMessageHandler
		? (data: string) => {
				if (typeof swiftMessageHandler.postMessage === "function") {
					swiftMessageHandler.postMessage(data);
				}
			}
		: undefined;

	return swiftPostMessage;
}
