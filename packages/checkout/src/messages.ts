export type WhopCheckoutState = "loading" | "ready" | "disabled";

export type WhopCheckoutMessage =
	| {
			event: "resize";
			height: number;
	  }
	| {
			event: "center";
	  }
	| {
			event: "complete";
			receipt_id?: string;
			plan_id: string;
	  }
	| {
			event: "state";
			state: WhopCheckoutState;
	  }
	| {
			event: "get-email-result";
			email: string;
			event_id: string;
	  }
	| {
			event: "set-email-result";
			ok: true;
			error?: never;
			event_id: string;
	  }
	| {
			event: "set-email-result";
			ok: false;
			error: string;
			event_id: string;
	  };

const EVENT_TYPES = [
	"resize",
	"center",
	"complete",
	"state",
	"get-email-result",
	"set-email-result",
] as const;
type WhopCheckoutEventType = WhopCheckoutMessage["event"];

export type WhopCheckoutRpcResponseMessage = Extract<
	WhopCheckoutMessage,
	{ event_id: string }
>;

export function isWhopCheckoutMessage(
	event: MessageEvent<unknown>,
): event is MessageEvent<WhopCheckoutMessage> {
	return (
		typeof event.data === "object" &&
		event.data !== null &&
		"event" in event.data &&
		EVENT_TYPES.includes(event.data.event as WhopCheckoutEventType)
	);
}

export function isWhopCheckoutResponseMessageMessage<
	E extends WhopCheckoutRpcResponseMessage["event"],
>(
	event: MessageEvent<unknown>,
	eventType: E,
): event is MessageEvent<
	Extract<WhopCheckoutRpcResponseMessage, { event: E }>
> {
	return isWhopCheckoutMessage(event) && event.data.event === eventType;
}

type InferredWhopCheckoutEventType = (typeof EVENT_TYPES)[number];

// if you understand this type hack you should consider working at Whop!
// https://whop.com/careers
const _: WhopCheckoutEventType extends InferredWhopCheckoutEventType
	? InferredWhopCheckoutEventType extends WhopCheckoutEventType
		? true
		: false
	: false = true;
