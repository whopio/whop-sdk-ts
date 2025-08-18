---
title: "Authentication"
icon: key
description: "An overview of authentication methods for the Whop API"
---

Access to the Whop API can be granted through two methods: API Keys and OAuth Credentials. All requests must include an `Authorization` header with the format `Bearer {TOKEN}`, where `TOKEN` is either the API key or the OAuth access token.

```bash
Authorization: Bearer {TOKEN}
```

Each API has its own method of authentication. You can read more about each API's authentication below:

- [App API](/api-reference/v5/apps/overview)
- [Company API](/api-reference/v5/company/overview)
- [Me API](/api-reference/v5/me/overview)
