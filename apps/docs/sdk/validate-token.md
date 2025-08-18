---
title: validateToken
description: "Authenticate the user"
---

To ensure that the user has purchased your app, and it isn't being used by someone else, we have created a function that you can use to validate that the user is allowed access.

For this function, you need to get the user's token from the cookies, it is called `whop_user_token`. If you are using Next.js, you can use the `headers` object from `next/headers`

You can access the user ID of the current used by assigning it to a variable, like so:

```typescript
import { headers } from "next/headers";
import { validateToken } from "@whop-apps/sdk";

export default async function SellerPage() {
  const { userId } = await validateToken({ headers });
}
```
