// Webhook types for v5 App webhooks
// Generated from Ruby serializers and webhook senders

// Common types used across webhooks
interface CustomFieldResponse {
	id: string;
	custom_field_id: string;
	value?: string | null;
}

// Membership related types
interface MembershipData {
	id: string;
	product_id: string;
	user_id?: string | null;
	plan_id: string;
	page_id: string;
	created_at: number;
	expires_at?: number | null;
	renewal_period_start?: number | null;
	renewal_period_end?: number | null;
	quantity: number;
	status: string;
	valid: boolean;
	cancel_at_period_end: boolean;
	license_key?: string | null;
	metadata?: Record<string, unknown> | null;
	checkout_id?: string | null;
	affiliate_username?: string | null;
	manage_url: string;
	company_buyer_id?: string | null;
	marketplace: boolean;
	custom_field_responses: CustomFieldResponse[];
}

// Payment/Receipt related types
interface ReceiptData {
	id: string;
	membership_id?: string | null;
	product_id?: string | null;
	user_id?: string | null;
	plan_id?: string | null;
	company_id: string;
	line_item_id?: string | null;
	created_at: number;
	paid_at?: number | null;
	refunded_at?: number | null;
	last_payment_attempt?: number | null;
	next_payment_attempt?: number | null;
	status: string;
	subtotal: number;
	final_amount: number;
	amount_after_fees?: number | null;
	currency: string;
	refunded_amount?: number | null;
	payments_failed: number;
	checkout_id?: string | null;
	card_brand?: string | null;
	card_last_4?: string | null;
	funding_method?: string | null;
	wallet_type?: "apple_pay" | "google_pay" | "paypal" | "venmo" | null;
	calculated_statement_descriptor?: string | null;
	issuer_identification_number?: string | null;
	billing_usage_ids: string[];
	company_buyer_id?: string | null;
	payment_method_type?: string | null;
	metadata?: Record<string, unknown> | null;
}

// Refund related types
interface RefundData {
	id: string;
	status: string;
	amount: number;
	currency: string;
	gateway_type: string;
	created_at: number;
	payment_id: string;
	payment: ReceiptData;
}

// Dispute related types
interface DisputeData {
	id: string;
	status: string;
	amount: number;
	currency: string;
	created_at: number;
	payment_id: string;
	payment: ReceiptData;
}

// Webhook types with discriminated unions
export type WhopWebhookRequestBody =
	| {
			action:
				| "membership.went_valid"
				| "membership.went_invalid"
				| "membership.metadata_updated"
				| "membership.cancel_at_period_end_changed"
				| "membership.experience_claimed";
			data: MembershipData;
	  }
	| {
			action:
				| "payment.succeeded"
				| "payment.failed"
				| "payment.pending"
				| "payment.affiliate_reward_created";
			data: ReceiptData;
	  }
	| {
			action: "refund.created" | "refund.updated";
			data: RefundData;
	  }
	| {
			action: "dispute.created" | "dispute.updated";
			data: DisputeData;
	  }
	| {
			action:
				| "app_membership.went_valid"
				| "app_membership.went_invalid"
				| "app_membership.cancel_at_period_end_changed";
			data: MembershipData;
	  }
	| {
			action:
				| "app_payment.succeeded"
				| "app_payment.failed"
				| "app_payment.pending";
			data: ReceiptData;
	  };
