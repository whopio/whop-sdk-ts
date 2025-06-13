---
"@whop/api": patch
---

Removes extra input and output objects from the generated code. This will require some code changes for old clients but should make the DX much better by being less verbose and annoying. For example getUser now returns the user object directly without being nested in a "publicUser" field
