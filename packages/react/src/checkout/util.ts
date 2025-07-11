import {
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_LIST,
	getEmbeddedCheckoutIframeUrl,
} from "@whop/checkout/util";
import { useEffect, useMemo } from "react";
import { useLazyRef } from "../util/use-lazy-ref";

type GetEmbeddedCheckoutIframeUrlParams = Parameters<
	typeof getEmbeddedCheckoutIframeUrl
>;

export function useEmbeddedCheckoutIframeUrl(
	...params: GetEmbeddedCheckoutIframeUrlParams
) {
	const { current: iframeUrl } = useLazyRef(() =>
		getEmbeddedCheckoutIframeUrl(...params),
	);

	useWarnOnIframeUrlChange(iframeUrl, ...params);

	return iframeUrl;
}

function useWarnOnIframeUrlChange(
	iframeUrl: string,
	...[
		planId,
		theme,
		sessionId,
		_origin,
		hidePrice,
		skipRedirect,
		utm,
		styles,
		prefill,
		themeOptions,
	]: GetEmbeddedCheckoutIframeUrlParams
) {
	const updatedIframeUrl = useMemo(
		() =>
			getEmbeddedCheckoutIframeUrl(
				planId,
				theme,
				sessionId,
				undefined,
				hidePrice,
				skipRedirect,
				utm,
				styles,
				prefill,
				themeOptions,
			),
		[
			planId,
			theme,
			sessionId,
			hidePrice,
			skipRedirect,
			utm,
			styles,
			prefill,
			themeOptions,
		],
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
