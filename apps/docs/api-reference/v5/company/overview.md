---
title: Overview
icon: circle-info
description: Overview of the Company API routes
---

The company API routes allow companies to directly access information about their business.

If you manage a business on Whop, this API is for you. You can use this API to retrieve data about your business.

## Common Use Cases

- Retrieving a single membership
- Listing your payments
- Creating line items for in app purchases

## Authentication

All requests will need your **company API Key**. This can be found on your [**developer settings page**](https://dash.whop.com/settings/developer). Be sure not to expose this API key on the client side. For more information on company API keys, click [**here**](/api-reference/v5/authentication#api-keys)

<Tip>
  If you have used the **V2 API**, this will be the same API key you used there.
</Tip>

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
