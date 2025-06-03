---
"@whop/api": patch
---

Split the functions available on the client and server SDK such that you cannot call mutations and queries on the client that will always fail due to auth issues.
