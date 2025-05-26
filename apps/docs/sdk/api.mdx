---
title: "Whop API"
description: Use the SDK to use our API and return it in a formatted JSON response
---

The API SDK allows you to interact with the Whop API without having to manually write the requests. All responses are typed which gives you type safety.

---

The SDK has 3 functions, `app`, `company`, and `me`. These dictate what namespace to use. From here, you will be able to select which type of request you are sending, such as `GET` or `POST`. You will then need to pass the route you are requesting, and the parameters.

The parameters object is typed, so you will be able to see what parameters are available for each endpoint.

For example, if you wanted to use the `/companies/{id}` endpoint, you would pass the following parameters object:

```
{
params: { path: { id: "biz_XXXX" } },
}
```

---

## App Mode

When you are using one of the **App** endpoints, you need to use this mode. This will use the app's API key to make requests, which can either be set in the environment variables, as `WHOP_API_KEY`, or passed in manually, like so:

```javascript
await WhopAPI.app({apiKey: ""})...
```

### Usage

```typescript
import { WhopAPI } from "@whop-apps/sdk";

export default async function Home() {
  const companyInformation = await WhopAPI.app().GET("/app/companies/{id}", {
    params: { path: { id: "biz_XXX" } },
  });
}
```

---

## Company Mode

When you are using one of the **Company** endpoints, you need to use this mode. This will use the company's API key to make requests, which can either be set in the environment variables, as `WHOP_API_KEY`, or passed in manually, like so:

```javascript
await WhopAPI.company({apiKey: ""})...
```

<Accordion title="How to get your API Key">

To get the API key for your app, head to your [**app's settings page**](https://dash.whop.com/settings/developer). You will then see the API Key card, where you can copy or reset your key.

<Frame>
  <img src="https://imgur.com/q23TKtQ.png" />
</Frame>

</Accordion>

### Usage

```typescript
import { WhopAPI } from "@whop-apps/sdk";

export default async function Home() {
  const userInformation = await WhopAPI.company().GET("/company/users/{id}", {
    params: { path: { id: "user_XXX" } },
  });
}
```

---

## Me Mode

When you are using one of the **Me** endpoints, you need to use this mode. This will use a user's access token. This can be retrieved by using the [/token](/api-reference/v5/me/token) endpoint, or if you are building an app, it can be retrieved from the `whop_user_token` cookie.

You either need to pass in the token manually, or you can pass in the `headers`.

### Headers Usage

```javascript
import { headers } from "next/headers";

const currentUser = await WhopAPI.me({ headers }).GET("/me", {});
```

### Token Usage

```javascript
const currentUser = await WhopAPI.me({ token: "" }).GET("/me", {});
```
