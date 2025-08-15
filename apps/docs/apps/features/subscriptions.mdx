---
title: Subscriptions
description: "Gate your app behind a subscription or one-time purchase"
---

## Setup your access pass on the dashboard.

1. Go to the your [app's dashboard](https://whop.com/dashboard/developer).
2. Select the access passes tab and create an access pass. Give it a name like "My App Premium"
3. Create a pricing plan for the access pass by clicking the "Add Pricing" button from the table row.
4. After creating the pricing plan, copy the plan id from the 3 dot menu in the pricing plan card.
5. Also copy the access pass id from the 3 dot menu in the access pass table row.

<Info>
  We recommend storing the access pass id and plan id in environment variables
  for your app. Eg:

```bash
NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID="prod_XXXXXXXX"
NEXT_PUBLIC_PREMIUM_PLAN_ID="plan_XXXXXXXX"
```

</Info>

## Check if users have access

When a user makes a request to your app, you can easily check if they have access using the whop api.

```typescript
const hasAccess = await whopSdk.access.checkIfUserHasAccessToAccessPass({
  accessPassId: process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID, // from step 5 above.
  userId: userId,
});
```

If a user does not have access, you can [prompt them to purchase](#collect-payment-from-users) or show a lite "free" version of the app to upsell them.

## Collect payment from users

<Warning>
  This function requires the iFrame SDK to be initialized. See [**iFrame
  Overview**](/sdk/iframe-setup) for more information.
</Warning>

Use the iframe sdk to collect payment from users. This will show a whop native payment modal in which the user can confirm their purchase.

<CodeGroup>
```tsx React
"use client";
import { useIframeSdk } from "@whop/react";

export default function GetAccessButton() {
  const iframeSdk = useIframeSdk();
  
  const [receiptId, setReceiptId] = useState<string>();
  const [error, setError] = useState<string>();
  
  async function handlePurchase() {
    try {
		const res = await iframeSdk.inAppPurchase({ planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID });
		
		if (res.status === "ok") {
			setReceiptId(res.data.receipt_id);
			setError(undefined);
		} else {
			setReceiptId(undefined);
			setError(res.error);
		}
    } catch (error) {
      console.error("Purchase failed:", error);
      setError("Purchase failed");
    }
  }
  
  return <button onClick={handlePurchase}>Get Access</button>;
}
```

```tsx Vanilla JS
import { iframeSdk } from "@/lib/iframe-sdk";

const getAccessButton = document.querySelector("button#get-access-button");
const receiptElement = document.querySelector("span#receiptContainer");
const errorElement = document.querySelector("span#errorContainer");

function setError(error?: string) {
  if (errorElement instanceof HTMLSpanElement) {
    errorElement.textContent = error ?? "";
  }
}

function setReceiptId(receiptId?: string) {
  if (receiptElement instanceof HTMLSpanElement) {
    receiptElement.textContent = receiptId ?? "";
  }
}

if (getAccessButton instanceof HTMLButtonElement) {
  getAccessButton.addEventListener(
    "click",
    async function onGetAccessButtonClick() {
      try {
        const res = await iframeSdk.inAppPurchase({
          planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID,
        });

        if (res.status === "ok") {
          setReceiptId(res.data.receipt_id);
          setError(undefined);
        } else {
          setReceiptId(undefined);
          setError(res.error);
        }
      } catch (error) {
        console.error("Purchase failed:", error);
        setError("Purchase failed");
      }
    }
  );
}
```

</CodeGroup>

# Attaching custom metadata to a subscription

You can attach custom metadata to a subscription by using the `createCheckoutSession` mutation.

For example, you can use this to associate a subscription with an experience or company that it was created for.
Using this you can attribute the source of the subscription and build powerful revenue sharing features into your app.

Before using the `iframeSdk.inAppPurchase` function, you need to create a checkout session, and pass it to the function.

### Create the checkout session in a server action.

Use the whopSdk to create a checkout session on your backend, pass the experienceId to this function.

```typescript
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function createSubscription(experienceId: string) {
  const { userId } = await whopSdk.verifyUserToken(await headers());

  // Check to make sure the current user has access to the experience.
  const hasAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
    userId,
    experienceId,
  });

  const checkoutSession = await whopSdk.payments.createCheckoutSession({
    planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID,
    metadata: {
      experienceId,
    },
  });

  return checkoutSession;
}
```

### Pass the checkout session to the iframeSdk.inAppPurchase function.

```tsx React
"use client";

import { useIframeSdk } from "@whop/react";
import { createSubscription } from "@/lib/actions/create-subscription";

export default function GetAccessButton({
  experienceId,
}: {
  experienceId: string;
}) {
  const iframeSdk = useIframeSdk();

  const [receiptId, setReceiptId] = useState<string>();
  const [error, setError] = useState<string>();

  async function handlePurchase() {
    try {
      const inAppPurchase = await createSubscription(experienceId);
      const res = await iframeSdk.inAppPurchase(inAppPurchase);

      if (res.status === "ok") {
        setReceiptId(res.data.receipt_id);
        setError(undefined);
      } else {
        setReceiptId(undefined);
        setError(res.error);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      setError("Purchase failed");
    }
  }

  return <button onClick={handlePurchase}>Get Access</button>;
}
```

This custom metadata will be available in the webhook payloads sent to your server (if enabled).

You can use the `payUser` mutation to share your subscription revenue with the creator of the experience.
