You are an expert AI developer tasked with creating an MDX documentation page for a Whop SDK function. This SDK function is a wrapper around a provided GraphQL query.

**Your Goal:** Generate a single MDX file and a JSON snippet for updating a configuration file.

**Given Information (from user):**
You will be provided with the content of a single GraphQL query file.

---
**START OF USER-PROVIDED GRAPHQL QUERY CONTENT**
```graphql
{{ PASTE GRAPHQL QUERY FILE CONTENT HERE }}
```
**END OF USER-PROVIDED GRAPHQL QUERY CONTENT**
---

**Instructions for Generating the MDX File:**

1.  **Identify GraphQL Operation:**
    *   Determine the operation name from the query (e.g., `getUser`, `listExperiences`).

2.  **Derive SDK Function Name and MDX Filename:**
    *   Convert the GraphQL operation name to kebab-case (e.g., `get-user`, `list-experiences`). This will be the MDX filename (without extension) and will also be used for the title.
    *   The SDK function call will use a camelCase version of this (e.g., `whopApi.getUser(...)`, `whopApi.listExperiences(...)`).

3.  **MDX File Location:**
    *   The new MDX file should be located at: `developer-documentation/sdk/api/<kebab-case-name>.mdx`

4.  **MDX File Content:**
    *   **Frontmatter:**
        *   `title`: String. A human-readable version of the kebab-case name, with only the first word capitalized (e.g., "Get user", "List experiences").
        *   `description`: String. A concise (1-2 sentences) explanation of what the SDK function/GraphQL query does.
    *   **Descriptive Paragraph:**
        *   Immediately following the frontmatter (NO `## H2 Header` here), write a brief paragraph (1-2 sentences) explaining the purpose of the SDK function and what it's used for.
    *   **Code Snippet:**
        *   Start the code block with ` ```typescript `.
        *   **Import:** Always include `import { whopApi } from "@/lib/whop-api";`.
        *   **SDK Call:**
            *   The code should be top-level (no async function wrappers `async () => {}` and then calling that function).
            *   Use `await` for the SDK call: `const result = (await whopApi.sdkFunctionName({param1: "value1", ...})).responseField;`
            *   **Parameters:**
                *   If the GraphQL query defines variables (e.g., `$userId: ID!`, `$input: MyInput!`), these become parameters for the SDK function, typically passed as a single object.
                *   Use the following placeholder values for IDs:
                    *   User ID: `"user_xxx"`
                    *   Access Pass ID / Product ID: `"prod_xxx"`
                    *   Experience ID: `"exp_xxx"`
                    *   Company ID: `"biz_xxx"`
                    *   Payment/Receipt ID: `"pay_xxx"`
                    *   Forum ID: `"feed_xxx"`
                    *   Generic ID (if no specific prefix applies): `"id_xxx"`
                *   For complex input objects (like `input: MyInput!`), include a commented-out example of the interface if its structure isn't obvious from the query variables alone.
                *   If the query uses enums (e.g., `FeedTypes`), provide an example string value and a comment (e.g., `feedType: "COMPANY_FEED", // Or FeedTypes.COMPANY_FEED`).
            *   **Result Access:**
                *   The useful data is typically nested under a key that matches the GraphQL query's main field (e.g., if the query is `query getUser { publicUser { ... } }`, the result is accessed via `(...).publicUser`).
                *   Use optional chaining (`?.`) where appropriate if intermediate fields in the response path might be null (e.g., `response.company?.experiencesV2`).
            *   **Logging:** Include `console.log()` statements to demonstrate accessing and displaying the fetched data. If the response is an object, log the object. If it's a list, log the list (or its nodes).
            *   **Error Handling:** For mutations, wrap the SDK call in a `try...catch` block and log any errors. (Although this prompt is for queries, this is good practice if adapting for mutations).
        *   **No Unnecessary Comments:** Avoid comments that explain obvious code.

5.  **Example MDX Structure:**

    ```mdx
    ---
    title: <Capitalized Kebab Case Name>
    description: <Concise description of the function.>
    ---

    Use the following snippet to <purpose of the function, e.g., "fetch user details">. <Any other important short info.>

    ```typescript
    import { whopApi } from "@/lib/whop-api";

    // Optional: Commented-out example of input interface if complex
    // interface SdkFunctionNameInput {
    //   someId: string;
    //   filter?: string;
    // }

    const inputParams = { /* id: "placeholder_xxx", otherParam: "value" */ };
    const responseData = (await whopApi.sdkFunctionName(inputParams)).relevantResponseField;

    if (responseData) {
      console.log(responseData);
      // console.log(responseData.nodes); // If applicable
    }
    ```
    ```

**Instructions for `mint.json` Update:**

1.  **File Location:** `developer-documentation/mint.json`
2.  **Action:** Add the path to the newly created MDX file to the `navigation` array.
3.  **Path Format:** `"sdk/api/<kebab-case-name>"`
4.  **Placement:**
    *   Determine the most appropriate subgroup under "Core Resources" or "Features". Make a sensible choice based on the function's purpose.
    *   **Known "Core Resources" subgroups:** `Users`, `Payments`, `Access Passes`, `Experiences`.
    *   **Known "Features" subgroups:** `Notifications`, `Forums`, `Chat`, `File Attachments`.
    *   Add the path string to the `pages` array of the chosen subgroup.

5.  **Example `mint.json` snippet to produce (this is what the AI should output for this part):**

    ```json
    // Add to "Core Resources" -> "Users" (example)
    {
      "group": "Users",
      "pages": [
        // ... existing pages ...
        "sdk/api/<kebab-case-name>"
      ]
    }
    ```
    *(The AI should only provide the snippet for the specific group it chose, not the whole mint.json)*

**Final Output:**
The AI should provide:
1.  The full content of the new `.mdx` file.
2.  The JSON snippet showing how to update `mint.json`.

Make sure to follow all conventions precisely, especially regarding naming, capitalization, code structure, and ID placeholders.
