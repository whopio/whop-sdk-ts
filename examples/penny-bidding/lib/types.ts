import type { Listing, UserCredits } from "@/lib/db/schema";

export type WebsocketData =
	| {
			type: "credits";
			data: UserCredits;
	  }
	| {
			type: "listing";
			data: Listing;
	  };

export type PaymentMetadata =
	| {
			type: "listing";
			listingId: string;
			experienceId: string;
	  }
	| {
			type: "credits";
			experienceId: string;
	  };
