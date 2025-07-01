import { ControlType, addPropertyControls } from "framer";
import React from "react";
import type { ReactNode } from "react";
import { WhopCheckoutEmbed as WhopReactCheckoutEmbed } from ".";

export default function WhopFramerCheckoutEmbed(props: {
	planId: string;
	theme?: "light" | "dark" | "system" | "auto";
	sessionId?: string;
	hidePrice?: boolean;
	skipRedirect?: boolean;
	onComplete?: () => void;
	fallback?: ReactNode;
}) {
	return (
		<WhopReactCheckoutEmbed
			planId={props.planId}
			theme={props.theme === "auto" ? undefined : props.theme}
			sessionId={props.sessionId}
			hidePrice={props.hidePrice}
			onComplete={props.onComplete}
			fallback={props.fallback}
		/>
	);
}

addPropertyControls(WhopFramerCheckoutEmbed, {
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
		description: "Set to true to hide the price in the embedded checkout form",
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
		description: "The fallback content to show while the checkout is loading.",
	},
});
