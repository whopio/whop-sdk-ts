"use client";

import type { WhopCheckoutAddress } from "@/types";
import React, {
	type MutableRefObject,
	type ReactNode,
	forwardRef,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING,
	type WhopCheckoutState,
	type WhopCheckoutSubmitDetails,
	type WhopEmbeddedCheckoutPrefillOptions,
	type WhopEmbeddedCheckoutStyleOptions,
	type WhopEmbeddedCheckoutThemeOptions,
	getAddress,
	getEmail,
	onWhopCheckoutMessage,
	setAddress,
	setEmail,
	submitCheckoutFrame,
} from "../util";
import { useIsHydrated } from "../util/use-is-hydrated";
import { type AccentColor, isAccentColor } from "./colors";
import {
	EMBEDDED_CHECKOUT_IFRAME_SANDBOX_STRING,
	type WhopCheckoutEmbedControls,
	useEmbeddedCheckoutIframeUrl,
} from "./util";

export interface WhopCheckoutEmbedThemeOptions {
	/**
	 * **Optional** - The accent color you want to use in the embed.
	 *
	 * defaults to `blue`
	 */
	accentColor?: AccentColor;
}

export interface WhopCheckoutEmbedProps {
	/**
	 * **Required** - The plan id you want to checkout.
	 */
	planId: string;
	/**
	 * **Optional** - A ref to the embed controls.
	 *
	 * This can be used to submit the checkout form.
	 */
	ref?: MutableRefObject<WhopCheckoutEmbedControls | null>;
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
	 * **Optional** - A callback function that will be called when the checkout state changes.
	 */
	onStateChange?: (
		/** The new state of the checkout. */
		state: WhopCheckoutState,
	) => void;
	/**
	 * **Optional** - A callback function that will be called when the address validation error occurs.
	 */
	onAddressValidationError?: (error: {
		/** The error message of the address validation error. */
		error_message: string;
		/** The error code of the address validation error. */
		error_code: string;
	}) => void;
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
	/**
	 * **Optional** - The prefill options to apply to the checkout embed.
	 *
	 * Used to prefill the email in the embedded checkout form.
	 * This setting can be helpful when integrating the embed into a funnel that collects the email prior to payment already.
	 */
	prefill?: WhopEmbeddedCheckoutPrefillOptions;
	/**
	 * **Optional** - The theme options to apply to the checkout embed.
	 */
	themeOptions?: WhopCheckoutEmbedThemeOptions;
	/**
	 * **Optional** - Set to `true` to hide the submit button in the embedded checkout form.
	 *
	 * @default false
	 */
	hideSubmitButton?: boolean;
	/**
	 * **Optional** - Set to `true` to hide the terms and conditions in the embedded checkout form.
	 *
	 * @default false
	 */
	hideTermsAndConditions?: boolean;
	/**
	 * **Optional** - Set to `true` to hide the email input in the embedded checkout form.
	 *
	 * @default false
	 */
	hideEmail?: boolean;
	/**
	 * **Optional** - Set to `true` to disable the email input in the embedded checkout form.
	 *
	 * @default false
	 */
	disableEmail?: boolean;
	/**
	 * **Optional** - Set to `true` to hide the address form in the embedded checkout form.
	 *
	 * @default false
	 */
	hideAddressForm?: boolean;
	/**
	 * **Optional** - The affiliate code to use for the checkout.
	 */
	affiliateCode?: string;
}

export type {
	WhopEmbeddedCheckoutPrefillOptions,
	WhopEmbeddedCheckoutStyleOptions,
};

const WhopCheckoutEmbedInner = forwardRef<
	WhopCheckoutEmbedControls,
	WhopCheckoutEmbedProps
>(
	(
		{
			planId,
			theme,
			sessionId,
			hidePrice = false,
			skipRedirect = false,
			onComplete,
			onStateChange,
			onAddressValidationError,
			utm,
			styles,
			prefill,
			themeOptions,
			hideSubmitButton = false,
			hideTermsAndConditions = false,
			hideEmail = false,
			disableEmail = false,
			hideAddressForm = false,
			affiliateCode,
		},
		ref,
	) => {
		const resolvedThemeOptions: WhopEmbeddedCheckoutThemeOptions =
			useMemo(() => {
				return {
					accentColor: isAccentColor(themeOptions?.accentColor)
						? themeOptions.accentColor
						: undefined,
				};
			}, [themeOptions?.accentColor]);

		const iframeUrl = useEmbeddedCheckoutIframeUrl(
			planId,
			theme,
			sessionId,
			undefined,
			hidePrice,
			skipRedirect || !!onComplete,
			utm,
			styles,
			prefill,
			resolvedThemeOptions,
			hideSubmitButton,
			hideTermsAndConditions,
			hideEmail,
			disableEmail,
			hideAddressForm,
			affiliateCode,
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
						case "state": {
							if (onStateChange) {
								onStateChange(message.state);
							}
							break;
						}
						case "address-validation-error": {
							if (onAddressValidationError) {
								onAddressValidationError({
									error_message: message.error_message,
									error_code: message.error_code,
								});
							}
							break;
						}
					}
				},
			);
		}, [onComplete, onStateChange, onAddressValidationError]);

		if (ref) {
			const controls: WhopCheckoutEmbedControls = {
				submit: (opts?: WhopCheckoutSubmitDetails) => {
					if (!iframeRef.current) return;
					submitCheckoutFrame(iframeRef.current, opts);
				},
				getEmail: (timeout?: number) => {
					if (!iframeRef.current)
						throw new Error("Whop embedded checkout frame not found");
					return getEmail(iframeRef.current, timeout);
				},
				setEmail: (email: string, timeout?: number) => {
					if (!iframeRef.current)
						throw new Error("Whop embedded checkout frame not found");
					return setEmail(iframeRef.current, email, timeout);
				},
				setAddress: (address: WhopCheckoutAddress, timeout?: number) => {
					if (!iframeRef.current)
						throw new Error("Whop embedded checkout frame not found");
					return setAddress(iframeRef.current, address, timeout);
				},
				getAddress: (timeout?: number) => {
					if (!iframeRef.current)
						throw new Error("Whop embedded checkout frame not found");
					return getAddress(iframeRef.current, timeout);
				},
			};
			if (typeof ref === "function") {
				ref(controls);
			} else {
				ref.current = controls;
			}
		}

		return (
			<iframe
				ref={iframeRef}
				allow={EMBEDDED_CHECKOUT_IFRAME_ALLOW_STRING}
				sandbox={EMBEDDED_CHECKOUT_IFRAME_SANDBOX_STRING}
				title="Whop Embedded Checkout"
				src={iframeUrl ?? undefined}
				style={{
					border: "none",
					height: `${height}px`,
					width: "100%",
					overflow: "hidden",
				}}
			/>
		);
	},
);

WhopCheckoutEmbedInner.displayName = "WhopCheckoutEmbedInner";

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
export const WhopCheckoutEmbed = forwardRef<
	WhopCheckoutEmbedControls,
	WhopCheckoutEmbedProps & {
		/**
		 * **Optional** - The fallback content to show while the checkout is loading.
		 */
		fallback?: ReactNode;
	}
>(({ fallback, ...props }, ref) => {
	const isHydrated = useIsHydrated();

	// return the fallback while the component is not hydrated
	if (!isHydrated) {
		return fallback ?? null;
	}

	return <WhopCheckoutEmbedInner {...props} ref={ref} />;
});

WhopCheckoutEmbed.displayName = "WhopCheckoutEmbed";
