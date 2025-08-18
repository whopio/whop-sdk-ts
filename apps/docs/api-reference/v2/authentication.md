---
title: "Authentication"
icon: key
description: "An overview of authentication methods for the Whop API"
---

Access to the Whop API can be granted through two methods: API Keys and OAuth Credentials. All requests must include an `Authorization` header with the format `Bearer {TOKEN}`, where `TOKEN` is either the API key or the OAuth access token.

```bash
Authorization: Bearer {TOKEN}
```

- [API Keys](/api-reference/v2/authentication#api-keys)
- [OAuth Credentials](/api-reference/v2/authentication#oauth-credentials)

---

## API Keys

An **API key** is a unique identifier that allows developers to access Whop's API on behalf of a company to validate licenses, retrieve user information, and more. It is needed for most endpoints.

<Warning>
  Protect your API keys to prevent unauthorized access. API keys can be a
  security risk if they fall into the wrong hands.
</Warning>

### Creating an API key

1. Head to your Developers setting panel under your business
2. Click **New API Key**
3. Set a memorable name for your key.
4. Copy the API key

![Create API key](https://dev-docs-weld.vercel.app/newapikey.gif)

### Scoped API keys

Scoped API keys provide access to specific resources or endpoints within Whop's API, restricting access to the entire API. This approach limits the actions that client-side code can perform and reduces potential security vulnerabilities.

Scoped API keys are **the best way** for your company to use client-sided keys.

![Scoped Key Setup](https://i.imgur.com/sbMzXjv.gif)

### Instructions to create a scoped API key

1. Create a new API key under the **Developers setting panel**
2. Click the triple dots and click **Edit permissions**
3. Add the permissions you want this key to have access to. If you are storing keys **client-side**, we recommend keeping your permissions as minimal as possible.
4. Save!

<Warning>
  When altering memberships, always perform operations server-side. Client-side
  requests should only be used for validation.
</Warning>

### Recommended API key scopes

- **Validate a license key**
  - `Membership/Validate License`
- **Retrieve a license key**
  - `Membership/Retrieve Membership`

---

## OAuth Credentials

Head to the [developer settings page](https://dash.whop.com/settings/developer) to obtain your Client ID and Client Secret. These keys will be used with the [**OAuth**](/oauth) endpoints to obtain an access token.

<Warning>
  Once you close the modal, you cannot view your Client Secret again. Store it
  securely. If needed, you can generate a new one, but the previous one will be
  invalidated.
</Warning>

![Auth Setup](https://i.imgur.com/Sqptcno.png)
