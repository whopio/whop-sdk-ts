---
title: "Rate Limits"
icon: gauge
---

## Overview

The Whop GraphQL API enforces rate limits to ensure fair usage and system stability.

## Current Limits

```http
10 requests per 10 seconds
```

## Query Complexity Limits

In addition to request rate limits, the GraphQL API enforces query complexity limits:

- **Max Complexity**: 1000
- **Max Depth**: 10

These limits help prevent overly complex or deeply nested queries that could impact performance. 
If you encounter these errors, you'll need to break your requests into smaller queries.

Learn more about query complexity and depth here: https://www.howtographql.com/advanced/4-security/

## Handling Rate Limits

If you exceed the rate limit, the API will respond with a `429 Too Many Requests` status code. 
When this happens, it's best to wait until the rate limit window resets before making additional requests.

## Best Practices

- Implement exponential backoff for retries
- Cache responses when possible
- Batch GraphQL operations into fewer requests 