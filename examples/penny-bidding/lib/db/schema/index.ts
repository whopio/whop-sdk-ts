import { createId } from "@paralleldrive/cuid2";
import {
	decimal,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
	createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
		.notNull()
		.defaultNow(),
};

function primaryKeyColumn() {
	return varchar("id", { length: 64 })
		.primaryKey()
		.$defaultFn(() => createId());
}

export type ListingStatus =
	| "active"
	| "pending_purchase"
	| "pending_fulfillment"
	| "complete";

export const listingsTable = pgTable(
	"listings",
	{
		id: primaryKeyColumn(),
		...timestamps,
		experienceId: varchar("experience_id", { length: 255 }).notNull(),
		createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),

		biddingEndsAt: timestamp("bidding_ends_at", {
			mode: "string",
			withTimezone: true,
		}).notNull(),
		initialPrice: decimal("initial_price", {
			precision: 10,
			scale: 2,
		}).notNull(),
		currentPrice: decimal("current_price", {
			precision: 10,
			scale: 2,
		}).notNull(),
		increment: decimal("increment", { precision: 10, scale: 2 }).notNull(),

		title: varchar("title", { length: 255 }).notNull(),
		imageUrl: varchar("image_url", { length: 255 }),
		description: varchar("description", { length: 255 }),

		lastBidderUserId: varchar("last_bidder_user_id", { length: 255 }),
		lastBidAt: timestamp("last_bid_at", {
			mode: "string",
			withTimezone: true,
		}),

		/// Set by the creator to optionally ask the auction winner to provide details before purchasing
		fulfillmentQuestion: text("fulfillment_question"),
		/// Set by the auction winner before paying for the listing.
		fulfillmentAnswer: text("fulfillment_answer"),
		/// Set in the webhook when the auction payment is confirmed.
		fulfilledAt: timestamp("fulfilled_at", {
			mode: "string",
			withTimezone: true,
		}),
		/// Set in the webhook when the auction payment is confirmed.
		fulfillmentReceiptId: varchar("fulfillment_receipt_id", { length: 255 }),
	},
	(t) => [index("experience_id").on(t.experienceId, t.createdAt.desc())],
);

export const userCreditsTable = pgTable("user_credits", {
	id: primaryKeyColumn(),
	...timestamps,
	userId: varchar("user_id", { length: 255 }).notNull(),
	credits: integer("credits").notNull().default(0),
});

export const bidsTable = pgTable("bids", {
	id: primaryKeyColumn(),
	...timestamps,
	userId: varchar("user_id", { length: 255 }).notNull(),
	listingId: varchar("listing_id", { length: 64 })
		.notNull()
		.references(() => listingsTable.id),
});

export const paymentsTable = pgTable("payments", {
	id: primaryKeyColumn(),
	...timestamps,
	userId: varchar("user_id", { length: 255 }).notNull(),
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	currency: varchar("currency", { length: 3 }).notNull(),
	amountAfterFees: decimal("amount_after_fees", {
		precision: 10,
		scale: 2,
	}).notNull(),
	experienceId: varchar("experience_id", { length: 255 }),
	listingId: varchar("listing_id", { length: 64 }),
	receiptId: varchar("receipt_id", { length: 255 }).notNull().unique(),
	purchaseType: varchar("purchase_type", { length: 255 })
		.notNull()
		.$type<"listing" | "credits">(),
});

export type Listing = typeof listingsTable.$inferSelect;
export type UserCredits = typeof userCreditsTable.$inferSelect;
export type Bid = typeof bidsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
