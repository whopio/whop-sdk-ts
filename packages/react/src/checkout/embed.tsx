"use client";

import {
	EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING,
	type WhopEmbeddedCheckoutStyleOptions,
	getEmbeddedCheckoutIframeUrl,
	onWhopCheckoutMessage,
} from "@whop/checkout/util";

// biome-ignore lint/style/useImportType: react is required for the module to work
import React, { useEffect, useRef, useState } from "react";

import { useIsHydrated } from "../util/use-is-hydrated";
import { useLazyRef } from "../util/use-lazy-ref";
import {
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_STRING,
	useWarnOnIframeUrlChange,
} from "./util";

export interface WhopCheckoutEmbedProps {
	/**
	 * **Required** - The plan id you want to checkout.
	 */
	planId: string;
	/**
	 * **Optional** - The theme you want to use for the checkout.
	 *
	 * Possible values are `light`, `dark` or `system`.
	 *
	 * @default "system"
	 */
	theme?: "light" | "dark" | "system";
	/**
	 * **Optional** - The session id to use for the checkout.
	 *
	 * This can be used to attach metadata to a checkout by first creating a session through the API and then passing the session id to the checkout element.
	 */
	sessionId?: string;
	/**
	 * **Optional** - Turn on to hide the price in the embedded checkout form.
	 *
	 * @default false
	 */
	hidePrice?: boolean;
	/**
	 * **Optional** - Set to `true` to skip the final redirect and keep the top frame loaded.
	 *
	 * @default false
	 */
	skipRedirect?: boolean;
	/**
	 * **Optional** - A callback function that will be called when the checkout is complete.
	 */
	onComplete?: (
		/** The plan id of the plan that was purchased. */
		plan_id: string,
		/** The receipt id of the purchase. */
		receipt_id?: string,
	) => void;
	/**
	 * **Optional** - The UTM parameters to add to the checkout URL.
	 *
	 * **Note** - The keys must start with `utm_`
	 */
	utm?: Record<string, string | string[]>;
	/**
	 * **Optional** - The styles to apply to the checkout embed.
	 */
	styles?: WhopEmbeddedCheckoutStyleOptions;
}

export type { WhopEmbeddedCheckoutStyleOptions };

function WhopCheckoutEmbedInner({
	planId,
	theme,
	sessionId,
	hidePrice = false,
	skipRedirect = false,
	onComplete,
	utm,
	styles,
}: WhopCheckoutEmbedProps): React.ReactNode {
	const { current: iframeUrl } = useLazyRef(() =>
		getEmbeddedCheckoutIframeUrl(
			planId,
			theme,
			sessionId,
			undefined,
			hidePrice,
			skipRedirect || !!onComplete,
			utm,
			styles,
		),
	);

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = useState(480);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		return onWhopCheckoutMessage(
			iframe,
			function handleWhopCheckoutMessage(message) {
				switch (message.event) {
					case "resize": {
						setHeight(message.height);
						break;
					}
					case "center": {
						iframe.scrollIntoView({ block: "center", inline: "center" });
						break;
					}
					case "complete": {
						if (onComplete) {
							onComplete(message.plan_id, message.receipt_id);
						}
						break;
					}
				}
			},
		);
	}, [onComplete]);

	useWarnOnIframeUrlChange(
		iframeUrl,
		planId,
		theme,
		sessionId,
		hidePrice,
		skipRedirect || !!onComplete,
	);

	return (
		<iframe
			ref={iframeRef}
			allow={EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING}
			sandbox={EMBEDDED_CHECKOUT_IFRAME_SANDBOX_STRING}
			title="Whop Embedded Checkout"
			src={iframeUrl}
			style={{
				border: "none",
				height: `${height}px`,
				width: "100%",
				overflow: "hidden",
			}}
		/>
	);
}

/**
 * This component can be used to embed whop checkout in your react app:
 *
 * ```tsx
 * import { WhopCheckoutEmbed } from "@whop/react/checkout";
 *
 * export default function Home() {
 *   return <WhopCheckoutEmbed planId="plan_XXXXXXXXX" />;
 * }
 * ```
 */
export function WhopCheckoutEmbed({
	fallback = null,
	...props
}: WhopCheckoutEmbedProps & {
	/**
	 * **Optional** - The fallback content to show while the checkout is loading.
	 */
	fallback?: React.ReactNode;
}): React.ReactNode {
	const isHydrated = useIsHydrated();

	// return the fallback while the component is not hydrated
	if (!isHydrated) {
		return fallback;
	}

	return <WhopCheckoutEmbedInner {...props} />;
}
