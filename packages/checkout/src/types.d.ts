declare global {
	interface Window {
		wco?: {
			injected: true;
			listening: boolean;
			frames: Map<HTMLIFrameElement, () => void>;
			identifiedFrames: Map<string, HTMLIFrameElement>;
			submit: (
				identifier: string,
				data?: WhopCheckoutSubmitDetails,
			) => Promise<void>;
			getEmail: (identifier: string, timeout?: number) => Promise<string>;
			setEmail: (
				identifier: string,
				email: string,
				timeout?: number,
			) => Promise<void>;
			getAddress: (
				identifier: string,
				timeout?: number,
			) => Promise<{
				address: WhopCheckoutAddress;
				isComplete: boolean;
			}>;
			setAddress: (
				identifier: string,
				address: WhopCheckoutAddress,
				timeout?: number,
			) => Promise<void>;
		};
	}
}

export interface PaymentRequestResult {
	method: string;
	response: {
		payerEmail?: string | null;
		details: PaymentResponse["details"];
	};
	options?: PaymentOptions;
	methodData: {
		requestShipping?: boolean;
		applePayMerchantIdentifier?: string;
	};
}

export type WhopCheckoutSubmitDetails = Record<never, never>;

export type WhopCheckoutAddress = {
	name: string;
	country: string;
	line1: string;
	line2?: string;
	city: string;
	state: string;
	postalCode: string;
};

declare global {
	// oxlint-disable-next-line no-var
	var PaymentRequest: {
		prototype: PaymentRequest;
		new (
			methodData: PaymentMethodData[],
			details: PaymentDetailsInit,
			options?: PaymentOptions,
		): PaymentRequest;
	};

	interface Window {
		PaymentRequest: {
			prototype: PaymentRequest;
			new (
				methodData: PaymentMethodData[],
				details: PaymentDetailsInit,
				options?: PaymentOptions,
			): PaymentRequest;
		};
	}

	interface PaymentOptions {
		requestPayerName?: boolean;
		requestBillingAddress?: boolean;
		requestPayerEmail?: boolean;
		requestPayerPhone?: boolean;
		requestShipping?: boolean;
		shippingType?: "shipping" | "delivery" | "pickup";
	}

	interface ApplyPayPaymentRequestPaymentOptions {
		requestPayerName?: boolean;
		requestBillingAddress?: boolean;
		requestPayerEmail?: boolean;
		requestPayerPhone?: boolean;
		requestShipping?: boolean;
		shippingType?: "shipping" | "delivery" | "pickup";
	}

	interface PaymentRequest {
		/**
		 * Apple Pay–specific event fired when Apple Pay
		 * needs merchant validation.
		 */
		onmerchantvalidation?: (event: ApplePayMerchantValidationEvent) => void;

		/**
		 * Apple Pay–specific event fired when the user changes
		 * payment method details (e.g., coupon code).
		 */
		onpaymentmethodchange?: (event: ApplePayPaymentMethodChangeEvent) => void;

		/**
		 * Apple Pay–specific event fired when the user changes
		 * shipping option (if you requested shipping).
		 */
		onshippingoptionchange?: (event: ApplePayShippingOptionChangeEvent) => void;

		/**
		 * Apple Pay–specific event fired when the user changes
		 * shipping address (if you requested shipping).
		 */
		onshippingaddresschange?: (
			event: ApplePayShippingAddressChangeEvent,
		) => void;
	}

	/**
	 * The event object passed to onmerchantvalidation.
	 */
	interface ApplePayMerchantValidationEvent extends Event {
		complete: (
			merchantSession:
				| ApplePayMerchantSession
				| Promise<ApplePayMerchantSession>,
		) => void;
		methodName: string;
		validationURL: string;
	}

	interface ApplePayPaymentContact {
		addressLines: string[];
		administrativeArea: string;
		country: string;
		countryCode: string;
		familyName: string;
		givenName: string;
		locality: string;
		phoneticFamilyName: string;
		phoneticGivenName: string;
		postalCode: string;
		subAdministrativeArea: string;
		subLocality: string;
	}

	/**
	 * The event object passed to onpaymentmethodchange.
	 * For example, you may check `event.methodDetails.couponCode`.
	 */
	interface ApplePayPaymentMethodChangeEvent extends Event {
		methodDetails?:
			| {
					type: string;
					billingContact: ApplePayPaymentContact;
			  }
			| {
					couponCode: string;
			  };
		updateWith: (
			details: PaymentDetailsUpdate | Promise<PaymentDetailsUpdate>,
		) => void;
	}

	interface ApplePayShippingOptionChangeEvent extends Event {
		updateWith: (details: PaymentDetailsUpdate) => void;
	}

	interface ApplePayShippingAddressChangeEvent extends Event {
		updateWith: (details: PaymentDetailsUpdate) => void;
	}

	/**
	 * A helper interface if you need to pass dynamic updates to `updateWith()`.
	 * This extends PaymentDetails with extra optional fields that Safari may expect.
	 */
	interface PaymentDetailsUpdate extends PaymentDetails {
		error?: string;
		shippingOptions?: PaymentShippingOption[];
		modifiers?: PaymentDetailsModifier[];
	}

	// Add this new interface for the merchant session
	interface ApplePayMerchantSession {
		merchantIdentifier: string;
		merchantSessionIdentifier: string;
		nonce: string;
		domainName: string;
		displayName: string;
		signature: string;
		epoch: string;
		expiresAt: number;
	}
}
