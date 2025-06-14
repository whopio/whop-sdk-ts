---
title: Validate access
description: Use this API to ensure users have access to use your app
---

Validate access to an embedded web app:

<CodeGroup>

```javascript Next.js
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

// The headers contains the user token
const headersList = await headers();

// The experienceId is a path param
// This can be configured in the Whop Dashboard, when you define your app
const { experienceId } = await params;

// The user token is in the headers
const { userId } = await whopSdk.verifyUserToken(headersList);

const result = await whopSdk.access.checkIfUserHasAccessToExperience({
  userId,
  experienceId,
});

if (!result.hasAccess) {
  return <div>You do not have access to this experience</div>;
}

// Either: 'admin' | 'customer' | 'no_access';
// 'admin' means the user is an admin of the whop, such as an owner or moderator
// 'customer' means the user is a common member in this whop
// 'no_access' means the user does not have access to the whop
const { accessLevel } = result;

if (accessLevel === "admin") {
  return <div>You are an admin of this experience</div>;
}

if (accessLevel === "customer") {
  return <div>You are a customer of this experience</div>;
}

return <div>You do not have access to this experience</div>;
```

</CodeGroup>
