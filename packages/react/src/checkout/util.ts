import {
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST,
	getEmbeddedCheckoutIframeUrl,
} from "@whop/checkout/util";
import { useEffect, useMemo } from "react";

export function useWarnOnIframeUrlChange(
	iframeUrl: string,
	planId: string,
	theme?: "light" | "dark" | "system",
	sessionId?: string,
	hidePrice?: boolean,
) {
	const updatedIframeUrl = useMemo(
		() =>
			getEmbeddedCheckoutIframeUrl(
				planId,
				theme,
				sessionId,
				undefined,
				hidePrice,
			),
		[planId, theme, sessionId, hidePrice],
	);

	useEffect(() => {
		if (
			iframeUrl !== updatedIframeUrl &&
			process.env.NODE_ENV === "development"
		) {
			console.warn(
				`[WhopCheckoutEmbed] iframeUrl changed from ${iframeUrl} to ${updatedIframeUrl}. Updating props on the checkout embed is not supported. Please rerender the component.`,
			);
		}
	}, [iframeUrl, updatedIframeUrl]);
}

export const EMBEDDED_CHECKOUT_IFRAME_SANDBOX_STRING =
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST.join(" ");
