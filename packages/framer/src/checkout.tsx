import type { WhopEmbeddedCheckoutPrefillOptions } from "@whop/checkout/util";
import {
	type WhopEmbeddedCheckoutStyleOptions,
	WhopCheckoutEmbed as WhopReactCheckoutEmbed,
} from "@whop/react/checkout";
import { ControlType, type PropertyControls } from "framer";
import React, { useMemo } from "react";
import type { ReactNode } from "react";

export interface WhopFramerCheckoutEmbedProps {
	planId: string;
	theme?: "light" | "dark" | "system" | "auto";
	sessionId?: string;
	hidePrice?: boolean;
	skipRedirect?: boolean;
	onComplete?: () => void;
	fallback?: ReactNode;
	containerPaddingTop?: number;
	containerPaddingBottom?: number;
	containerPaddingY?: number;
	prefillEmail?: string;
}

export function WhopFramerCheckoutEmbed(props: WhopFramerCheckoutEmbedProps) {
	const styles: WhopEmbeddedCheckoutStyleOptions = useMemo(() => {
		return {
			container: {
				paddingBottom: props.containerPaddingBottom,
				paddingTop: props.containerPaddingTop,
				paddingY: props.containerPaddingY,
			},
		};
	}, [
		props.containerPaddingBottom,
		props.containerPaddingTop,
		props.containerPaddingY,
	]);
	const prefill: WhopEmbeddedCheckoutPrefillOptions = useMemo(() => {
		return {
			email: props.prefillEmail,
		};
	}, [props.prefillEmail]);
	return (
		<WhopReactCheckoutEmbed
			planId={props.planId}
			theme={props.theme === "auto" ? undefined : props.theme}
			sessionId={props.sessionId}
			hidePrice={props.hidePrice}
			onComplete={props.onComplete}
			fallback={props.fallback}
			styles={styles}
			prefill={prefill}
		/>
	);
}

export const propertyControls: PropertyControls<WhopFramerCheckoutEmbedProps> =
	{
		planId: {
			type: ControlType.String,
			title: "Plan ID",
			description: "The plan ID you want to checkout",
		},
		theme: {
			type: ControlType.Enum,
			displaySegmentedControl: true,
			defaultValue: "auto",
			segmentedControlDirection: "vertical",
			options: ["light", "dark", "system", "auto"],
			optionTitles: ["Light", "Dark", "System", "Auto"],
			description: "The theme you want to use for the checkout",
		},
		sessionId: {
			type: ControlType.String,
			title: "Session ID",
			description:
				"The session ID you want to use for the checkout (i.e. 'ch_xxxxxxx'",
		},
		hidePrice: {
			type: ControlType.Boolean,
			title: "Hide Price",
			defaultValue: false,
			description:
				"Set to true to hide the price in the embedded checkout form",
		},
		skipRedirect: {
			type: ControlType.Boolean,
			title: "Skip Redirect",
			defaultValue: false,
			description:
				"Set to true to skip the final redirect and keep the top frame loaded",
		},
		onComplete: {
			type: ControlType.EventHandler,
			description:
				"A callback function that will be called when the checkout is complete",
		},
		fallback: {
			type: ControlType.ComponentInstance,
			description:
				"The fallback content to show while the checkout is loading.",
		},
		containerPaddingTop: {
			type: ControlType.Number,
			description: "The top padding of the checkout embed container",
		},
		containerPaddingBottom: {
			type: ControlType.Number,
			description: "The bottom padding of the checkout embed container",
		},
		containerPaddingY: {
			type: ControlType.Number,
			description: "The vertical padding of the checkout embed container",
		},
		prefillEmail: {
			type: ControlType.String,
			description: "The email to prefill in the checkout embed",
		},
	};
