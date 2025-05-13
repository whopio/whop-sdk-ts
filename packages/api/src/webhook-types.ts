/**
 * TypeScript types for Whop V5 webhook request bodies
 */

// Common Types

interface BaseAddress {
	line1?: string;
	line2?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
	name?: string;
}

interface BaseUser {
	id: string;
	email?: string;
	username?: string;
	profile_pic_url?: string;
}

interface BaseExperience {
	id: string;
	title: string;
	type: string;
}

interface BasePlan {
	id: string;
	name: string;
	base_price: number;
	billing_period?: number;
	base_currency: string;
	is_recurring: boolean;
	has_trial?: boolean;
	trial_period_days?: number;
}

interface BaseAccessPass {
	id: string;
	title: string;
	description?: string;
	image_url?: string;
	experiences?: BaseExperience[];
}

interface BaseMembership {
	id: string;
	status:
		| "trialing"
		| "active"
		| "past_due"
		| "completed"
		| "canceled"
		| "expired"
		| "unresolved";
	user: BaseUser;
	access_pass: BaseAccessPass;
	plan: BasePlan;
	// biome-ignore lint/suspicious/noExplicitAny: better DX with any here
	metadata?: Record<string, any>;
	license_key?: string;
	valid_status: boolean;
	cancel_at_period_end: boolean;
	quantity: number;
	renewal_period_end?: string;
	renewal_period_start?: string;
	created_at: string;
	canceled_at?: string;
	payment_processor:
		| "free"
		| "stripe"
		| "coinbase"
		| "crypto"
		| "paypal"
		| "apple"
		| "multi_psp"
		| "sezzle"
		| "splitit";
	currency?: string;
}

interface BasePayment {
	id: string;
	status:
		| "draft"
		| "open"
		| "paid"
		| "pending"
		| "uncollectible"
		| "unresolved"
		| "void";
	amount: number;
	currency: string;
	billing_reason?: string;
	user: BaseUser;
	membership?: BaseMembership;
	plan: BasePlan;
	access_pass: BaseAccessPass;
	// biome-ignore lint/suspicious/noExplicitAny: better DX with any here
	metadata?: Record<string, any>;
	initial: boolean;
	created_at: string;
	paid_at?: string;
	payment_processor:
		| "stripe"
		| "coinbase"
		| "crypto"
		| "nft"
		| "paypal"
		| "free"
		| "apple"
		| "multi_psp"
		| "sezzle"
		| "splitit";
	refunded_amount?: number;
	refunded_at?: string;
	payment_method_type?: string;
	last4?: string;
	address?: BaseAddress;
}

interface BaseDispute {
	id: string;
	status:
		| "warning_needs_response"
		| "warning_under_review"
		| "warning_closed"
		| "needs_response"
		| "under_review"
		| "won"
		| "lost"
		| "closed"
		| "other";
	amount: number;
	currency: string;
	payment: BasePayment;
	reason?: string;
	provider: string;
	provider_created_at?: string;
	due_date?: string;
	created_at: string;
}

interface BaseRefund {
	id: string;
	status: "pending" | "requires_action" | "succeeded" | "failed" | "canceled";
	amount: number;
	currency: string;
	payment: BasePayment;
	provider: string;
	reason?:
		| "duplicate"
		| "fraudulent"
		| "requested_by_customer"
		| "expired_uncaptured_charge";
	created_at: string;
}

// Webhook Request Types

interface WebhookBaseRequest {
	action: string;
	company?: string;
	data: unknown;
}

// Membership Webhooks

interface MembershipWentValidRequest extends WebhookBaseRequest {
	action: "membership.went_valid";
	data: BaseMembership;
}

interface MembershipWentInvalidRequest extends WebhookBaseRequest {
	action: "membership.went_invalid";
	data: BaseMembership;
}

interface MembershipMetadataUpdatedRequest extends WebhookBaseRequest {
	action: "membership.metadata_updated";
	data: BaseMembership;
}

interface MembershipCancelAtPeriodEndChangedRequest extends WebhookBaseRequest {
	action: "membership.cancel_at_period_end_changed";
	data: BaseMembership;
}

interface MembershipExperienceClaimedRequest extends WebhookBaseRequest {
	action: "membership.experience_claimed";
	data: BaseMembership & {
		claimed_experience: BaseExperience;
	};
}

// Payment Webhooks

interface PaymentSucceededRequest extends WebhookBaseRequest {
	action: "payment.succeeded";
	data: BasePayment;
}

interface PaymentFailedRequest extends WebhookBaseRequest {
	action: "payment.failed";
	data: BasePayment;
}

interface PaymentPendingRequest extends WebhookBaseRequest {
	action: "payment.pending";
	data: BasePayment;
}

interface PaymentAffiliateRewardCreatedRequest extends WebhookBaseRequest {
	action: "payment.affiliate_reward_created";
	data: BasePayment & {
		affiliate_reward: {
			id: string;
			amount: number;
			currency: string;
		};
	};
}

// Refund Webhooks

interface RefundCreatedRequest extends WebhookBaseRequest {
	action: "refund.created";
	data: BaseRefund;
}

interface RefundUpdatedRequest extends WebhookBaseRequest {
	action: "refund.updated";
	data: BaseRefund;
}

// Dispute Webhooks

interface DisputeCreatedRequest extends WebhookBaseRequest {
	action: "dispute.created";
	data: BaseDispute;
}

interface DisputeUpdatedRequest extends WebhookBaseRequest {
	action: "dispute.updated";
	data: BaseDispute;
}

// App Webhooks

interface AppMembershipWentValidRequest extends WebhookBaseRequest {
	action: "app_membership.went_valid";
	data: BaseMembership;
}

interface AppMembershipWentInvalidRequest extends WebhookBaseRequest {
	action: "app_membership.went_invalid";
	data: BaseMembership;
}

interface AppMembershipCancelAtPeriodEndChangedRequest
	extends WebhookBaseRequest {
	action: "app_membership.cancel_at_period_end_changed";
	data: BaseMembership;
}

interface AppPaymentSucceededRequest extends WebhookBaseRequest {
	action: "app_payment.succeeded";
	data: BasePayment;
}

interface AppPaymentFailedRequest extends WebhookBaseRequest {
	action: "app_payment.failed";
	data: BasePayment;
}

interface AppPaymentPendingRequest extends WebhookBaseRequest {
	action: "app_payment.pending";
	data: BasePayment;
}

// Discriminated Union Type
export type WhopWebhookRequestBody =
	| MembershipWentValidRequest
	| MembershipWentInvalidRequest
	| MembershipMetadataUpdatedRequest
	| MembershipCancelAtPeriodEndChangedRequest
	| MembershipExperienceClaimedRequest
	| PaymentSucceededRequest
	| PaymentFailedRequest
	| PaymentPendingRequest
	| PaymentAffiliateRewardCreatedRequest
	| RefundCreatedRequest
	| RefundUpdatedRequest
	| DisputeCreatedRequest
	| DisputeUpdatedRequest
	| AppMembershipWentValidRequest
	| AppMembershipWentInvalidRequest
	| AppMembershipCancelAtPeriodEndChangedRequest
	| AppPaymentSucceededRequest
	| AppPaymentFailedRequest
	| AppPaymentPendingRequest;
