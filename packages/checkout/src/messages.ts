import type { PaymentRequestResult, WhopCheckoutAddress } from "./types";

export type WhopCheckoutState = "loading" | "ready" | "disabled";

type EmbeddedCheckoutBaseEvent<T extends Record<string, unknown>> = {
	__scope: "whop-embedded-checkout";
	event_id: string;
} & T;

type PaymentRequestCreateRequest = EmbeddedCheckoutBaseEvent<{
	event: "payment-request-create-request";
	method_data: PaymentMethodData[];
	details: PaymentDetailsInit;
	options?: PaymentOptions;
}>;

export type PaymentRequestCreateResult = EmbeddedCheckoutBaseEvent<
	{
		event: "payment-request-create-result";
	} & (
		| {
				ok: true;
				id: string;
		  }
		| {
				ok: false;
				error: string;
		  }
	)
>;

type PaymentRequestUpdateRequest = EmbeddedCheckoutBaseEvent<{
	event: "payment-request-update-request";
	id: string;
	method_data?: PaymentMethodData[];
	details?: PaymentDetailsInit;
	options?: PaymentOptions;
	active?: boolean;
}>;

export type PaymentRequestUpdateResult = EmbeddedCheckoutBaseEvent<
	{
		event: "payment-request-update-result";
	} & (
		| {
				ok: true;
		  }
		| {
				ok: false;
				error: string;
		  }
	)
>;

export type PaymentRequestPaymentMethodChangeRequest =
	EmbeddedCheckoutBaseEvent<{
		event: "payment-request-payment-method-change-request";
		data?: ApplePayPaymentMethodChangeEvent["methodDetails"];
		id: string;
	}>;

type PaymentRequestEventResult = EmbeddedCheckoutBaseEvent<
	{
		event: "payment-request-event-result";
	} & (
		| {
				ok: true;
				details: PaymentDetailsUpdate;
		  }
		| {
				ok: false;
				error: string;
		  }
	)
>;

export type PaymentRequestMerchantValidationRequest =
	EmbeddedCheckoutBaseEvent<{
		event: "payment-request-merchant-validation-request";
		validationURL: string;
		methodName: string;
		id: string;
	}>;

type PaymentRequestMerchantValidationResult = EmbeddedCheckoutBaseEvent<
	{
		event: "payment-request-merchant-validation-result";
	} & (
		| {
				ok: true;
				merchantSession: ApplePayMerchantSession;
		  }
		| {
				ok: false;
				error: string;
		  }
	)
>;

export type SubmitRequest = EmbeddedCheckoutBaseEvent<{
	event: "submit";
	payment_request_result?: PaymentRequestResult;
}>;

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
	  }
	| {
			event: "set-address-result";
			ok: true;
			error?: never;
			event_id: string;
	  }
	| {
			event: "set-address-result";
			ok: false;
			error: string;
			event_id: string;
	  }
	| {
			event: "get-address-result";
			ok: true;
			address: WhopCheckoutAddress;
			is_complete: boolean;
			event_id: string;
	  }
	| {
			event: "get-address-result";
			ok: false;
			error: string;
			event_id: string;
	  }
	| {
			event: "address-validation-error";
			error_message: string;
			error_code: string;
	  }
	| PaymentRequestMerchantValidationResult
	| PaymentRequestUpdateRequest
	| PaymentRequestCreateRequest
	| PaymentRequestEventResult;

const EVENT_TYPES = [
	"resize",
	"center",
	"complete",
	"state",
	"get-email-result",
	"set-email-result",
	"set-address-result",
	"get-address-result",
	"address-validation-error",
	"payment-request-merchant-validation-result",
	"payment-request-update-request",
	"payment-request-create-request",
	"payment-request-event-result",
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
