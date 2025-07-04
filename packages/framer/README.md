# @whop/framer

To embed Whop checkout in a Framer project, you can utilize Framer Code components with the Whop React SDK.

## WhopEmbeddedCheckout

### Step 1: Create a new Framer Code component

Navigate to the **Assets** tab in your framer project, click the **+** button next to **Code** and select **New Code File**.

### Step 2: Add the checkout embed code component

> You do not have to install the package explicitly. Framer will automatically detect and install the package for you.

Paste the following code into the editor:

```tsx
export { default } from "@whop/framer/checkout";
```

You can now use the checkout embed component in your project and configure it through the framer interface.
