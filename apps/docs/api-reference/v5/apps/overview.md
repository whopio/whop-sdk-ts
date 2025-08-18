---
title: Overview
icon: circle-info
description: Overview of the App API Routes
---

The **apps** endpoints are designed for developers who are building [**Whop Apps**](/apps/overview).


If you are an app builder, this API is for you -- this is how your app will retrieve data "server side". All requests will authenticate using your app's API key.

All data returned will be scoped to your app. You will use this API to retrieve data from companies and users who have installed your app.

## Common Use Cases

- Fetching information about a company
- Sending notifications to users
- Creating line items for in app purchases

## Authentication

All requests will need your **App API Key**. This can be found in your app's settings page. Be sure not to expose this API key on the client side.
