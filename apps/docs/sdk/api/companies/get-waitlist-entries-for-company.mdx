---
title: Get Waitlist Entries For Company
description: Fetch a company
---
<Note>This operation is only available on the server.</Note>
```typescript
import { whopSdk } from "@/lib/whop-sdk";

const result = await whopSdk.companies.getWaitlistEntriesForCompany({
	// ID of the company, either the tag (biz_xxx) or the page route (whop-dev)
	companyId: "biz_XXXXXXXX" /* Required! */,

	after: "pageInfo.endCursor",

	before: "pageInfo.startCursor",

	first: 10,

	last: 10,
});

```

Example output:

```typescript
const response = {
	// The creator dashboard table for the company
	creatorDashboardTable: {
		// Entries
		entries: {
			// A list of nodes.
			nodes: [
				{
					// The status of the entry.
					status: "any" /* Valid values: any | approved | denied | pending */,

					// The name of the raffle/waitlist.
					name: "some string",

					// Responses collected from the user when submitting their entry.
					customFieldResponses: [
						{
							// The question asked by the custom field
							question: "some string",

							// The response a user gave to the specific question or field.
							answer: "some string",
						},
					],

					// The plan the entry is connected to.
					plan: {
						// The internal ID of the plan.
						id: "xxxxxxxxxxx",
					},

					// The user who created the entry.
					user: {
						// The internal ID of the user.
						id: "xxxxxxxxxxx",

						// The username of the user from their Whop account.
						username: "some string",

						// The user's profile picture
						profilePicture: {
							// The original URL of the attachment, such as a direct link to S3. This should
							// never be displayed on the client and always passed to an Imgproxy transformer.
							sourceUrl: "some string",
						},
					},
				},
			],

			// Information to aid in pagination.
			pageInfo: {
				// When paginating forwards, are there more items?
				hasNextPage: true,

				// When paginating backwards, are there more items?
				hasPreviousPage: true,

				// When paginating backwards, the cursor to continue.
				startCursor: "some string",

				// When paginating forwards, the cursor to continue.
				endCursor: "some string",
			},

			// The total number of items in this connection.
			totalCount: 10,
		},
	},
};

```
