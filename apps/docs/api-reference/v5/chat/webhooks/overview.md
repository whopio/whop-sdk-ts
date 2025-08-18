---
title: Overview
icon: circle-info
description: Overview of the chat webhooks
---

Chat webhooks allow companies to post messages to their customers via automated systems.
Messages posted by a webhook will be labeled as "BOT", so it's easy to tell them apart from regular messages.

The chat webhook interface was designed to be compatible with Discord's webhook API, allowing seamless integration with systems that support Discord webhooks.

## Authentication

Webhook authentication is handled via a secret key that is provided to the webhook endpoint.
This key is used to verify the authenticity of the request and prevent unauthorized access.

<Tip>
    When you create a webhook, the secret key is generated and included in the Webhook URL. Don't share this key with anyone.
</Tip>

## Creating a webhook

1. Head to the chat configuration page for the chat you want to create a webhook for.
2. Click **Create Webhook**
3. Set a memorable name for your webhook.
4. Copy the Webhook URL
