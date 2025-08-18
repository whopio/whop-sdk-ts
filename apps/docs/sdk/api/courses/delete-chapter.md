---
title: Delete Chapter
---

```typescript
import { whopSdk } from "@/lib/whop-sdk";

const result = await whopSdk.courses.deleteChapter({
	// The ID of the chapter to delete
	id: "xxxxxxxxxxx" /* Required! */,
});

```

Example output:

```typescript
const response = true;

```
