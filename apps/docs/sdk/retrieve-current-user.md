---
title: Retrieve current user
description: Retrieve the public profile information for the currently logged in user
---

Verify and extract the user's ID from a JWT token passed in the `x-whop-user-token` header passed to iframe apps on your backend.

<Info>
  Ensure you have [setup your whop SDK client on the
  server](/sdk/whop-api-client)
</Info>

<CodeGroup>
```javascript Next.js
// app/experiences/[experienceId]/page.tsx

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export default async function Page() {
    const headersList = await headers(); // Get the headers from the request.

    // Extract the user ID (read from a verified auth JWT token)
    const { userId } = await whopSdk.verifyUserToken(headersList);

    // Load the user's public profile information
    const user = await whopSdk.users.getUser({ userId: userId });

    console.log(user);

    return (
      <div>
      	<h1>User</h1>
      	<pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    );

}

````

</CodeGroup>

### Not using the Whop TS SDK?

<Accordion title="How to authenticate users in other languages">

In order to retrieve the current user's ID, you need to decrypt a JWT token that is stored in the `x-whop-user-token` header. `VerifyUserToken` is a helper function in our TS SDK that decodes the JWT token and returns the user's ID.

If are using a different framework and do not have access to the Typescript Whop SDK, you will need to implement your own JWT decoding logic. Here is an example of how to do this in Ruby on Rails:

```ruby Ruby on Rails
require 'jwt'
require 'openssl'

# This is a static public key that is used to decode the JWT token
# You can put this into your application
JWT_PEM = <<~PEM.freeze
  -----BEGIN PUBLIC KEY-----
  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErz8a8vxvexHC0TLT91g7llOdDOsN
  uYiGEfic4Qhni+HMfRBuUphOh7F3k8QgwZc9UlL0AHmyYqtbhL9NuJes6w==
  -----END PUBLIC KEY-----
PEM

# In your request handler, extract the user token from the headers.
user_token = request.headers["x-whop-user-token"]
return if user_token.blank?

# Decode and validate the JWT token.
key = OpenSSL::PKey::EC.new(JWT_PEM)
payload, _header = JWT.decode user_token, key, true, {
  iss: "urn:whopcom:exp-proxy",
  verify_iss: true,
  algorithm: "ES256"
}

# Extract your app ID from the JWT token.
jwt_app_id = payload["aud"]

# WARNING! You must set the WHOP_APP_ID environment variable in your application.
# This looks like app_xxxx.
# Validate that the JWT token is for YOUR app. (prevents someone from spoofing the user ID by passing a JWT token for a different app)
return if jwt_app_id != ENV.fetch("WHOP_APP_ID")

# Extract the user ID from the JWT token.
jwt_user_id = payload["sub"]
````

</Accordion>
