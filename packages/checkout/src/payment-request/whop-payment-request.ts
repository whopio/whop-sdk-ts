import type {
	PaymentRequestMerchantValidationRequest,
	PaymentRequestPaymentMethodChangeRequest,
} from "@/messages";
import { rpc } from "@/rpc";
import type { PaymentRequestResult } from "@/types";
import { uuidv4Safe } from "@/uuid-v4";

export class WhopPaymentRequest {
	private static readonly requests: WeakMap<
		HTMLIFrameElement,
		WhopPaymentRequest
	> = new WeakMap();

	private static readonly activeRequests: WeakMap<HTMLIFrameElement, boolean> =
		new WeakMap();

	public static get(iframe: HTMLIFrameElement): WhopPaymentRequest | null {
		return WhopPaymentRequest.requests.get(iframe) ?? null;
	}

	public static create(
		iframe: HTMLIFrameElement,
		methodData: PaymentMethodData[],
		details: PaymentDetailsInit,
		options?: PaymentOptions,
	): WhopPaymentRequest {
		const request = new WhopPaymentRequest(
			iframe,
			methodData,
			details,
			options,
		);
		WhopPaymentRequest.requests.set(iframe, request);
		return request;
	}

	public static remove(iframe: HTMLIFrameElement): void {
		WhopPaymentRequest.requests.get(iframe)?.abort();
		WhopPaymentRequest.requests.delete(iframe);
		WhopPaymentRequest.activeRequests.delete(iframe);
	}

	public static setActive(iframe: HTMLIFrameElement, active: boolean): void {
		WhopPaymentRequest.activeRequests.set(iframe, active);
	}

	public readonly id: string = uuidv4Safe();

	public get active(): boolean {
		const active = WhopPaymentRequest.activeRequests.get(this.iframe) ?? false;
		return active;
	}

	private abortController?: AbortController;

	private constructor(
		private iframe: HTMLIFrameElement,
		private methodData: PaymentMethodData[],
		private details: PaymentDetailsInit,
		private options?: PaymentOptions,
	) {}

	public updateMethodData(methodData: PaymentMethodData[]): void {
		this.methodData = methodData;
	}

	public updateDetails(details: PaymentDetailsInit): void {
		this.details = details;
	}

	public updateOptions(options: PaymentOptions): void {
		this.options = options;
	}

	public async getResult(): Promise<PaymentRequestResult> {
		const abortController = new AbortController();
		this.abortController = abortController;
		const paymentRequest = new PaymentRequest(
			this.methodData,
			this.details,
			this.options,
		);

		paymentRequest.onmerchantvalidation = async (ev) => {
			const eventData: Omit<
				PaymentRequestMerchantValidationRequest,
				"event_id" | "__scope"
			> = {
				event: "payment-request-merchant-validation-request",
				validationURL: ev.validationURL,
				methodName: ev.methodName,
				id: this.id,
			};
			const merchantSessionResult = await rpc(
				this.iframe,
				eventData,
				"payment-request-merchant-validation-result",
				(res) => res,
				null,
				abortController.signal,
			).catch(() => null);
			if (!merchantSessionResult?.ok) {
				paymentRequest.abort();
			} else {
				ev.complete(merchantSessionResult.merchantSession);
			}
		};

		paymentRequest.onshippingaddresschange = (ev) => {
			ev.updateWith({});
		};

		paymentRequest.onpaymentmethodchange = async (ev) => {
			const eventData: Omit<
				PaymentRequestPaymentMethodChangeRequest,
				"event_id" | "__scope"
			> = {
				event: "payment-request-payment-method-change-request",
				id: this.id,
				data: ev.methodDetails,
			};
			const paymentMethodChangeResult = await rpc(
				this.iframe,
				eventData,
				"payment-request-event-result",
				(res) => res,
				null,
				abortController.signal,
			).catch(() => null);
			if (!paymentMethodChangeResult?.ok) {
				ev.updateWith({});
			} else {
				ev.updateWith(paymentMethodChangeResult.details);
			}
		};
		let pRequest: PaymentRequest | null = paymentRequest;
		let cleanupAbortPromise: (() => void) | undefined;
		try {
			const abortPromise = new Promise<never>((_, reject) => {
				const onAbort = () => {
					reject(new Error("Aborted"));
				};
				abortController.signal.addEventListener("abort", onAbort, {
					once: true,
				});
				cleanupAbortPromise = () => {
					abortController.signal.removeEventListener("abort", onAbort);
				};
			});
			const paymentResponse = await Promise.race([
				paymentRequest.show().then((res) => {
					pRequest = null;
					return res;
				}),
				abortPromise,
			]);

			const methodData = this.methodData.find((md) => {
				return md.supportedMethods === paymentResponse.methodName;
			});

			if (!methodData) {
				await paymentResponse.complete("fail");
				throw new Error(
					"PaymentRequest failed to complete because of missing method data",
				);
			}

			await paymentResponse.complete("success");

			const result: PaymentRequestResult = {
				method: paymentResponse.methodName,
				response: {
					payerEmail: paymentResponse.payerEmail,
					details: JSON.parse(JSON.stringify(paymentResponse.details)),
				},
				options: this.options,
				methodData: {
					applePayMerchantIdentifier: methodData?.data?.merchantIdentifier,
					requestShipping: methodData?.data?.requiredShippingContactFields,
				},
			};
			return result;
		} finally {
			pRequest?.abort();
			cleanupAbortPromise?.();
			this.abortController = undefined;
		}
	}

	private abort(): void {
		this.abortController?.abort();
	}
}
