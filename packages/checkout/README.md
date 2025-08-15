# @whop/checkout - Embed Whop checkout on your page

Embedded checkout allows you to embed Whop's checkout flow on your own website in two easy steps. This allows you to offer your users a seamless checkout experience without leaving your website.

React users should use the `@whop/react` package which includes a version of this feature optimized for react.

## Step 1: Add the script tag

To embed checkout, you need to add the following script tag into the `<head>` of your page:

```md
<script
  async
  defer
  src="https://js.whop.com/static/checkout/loader.js"
></script>
```

## Step 2: Add the checkout element

To create a checkout element, you need to include the following attribute on an element in your page:

```md
<div data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

This will now mount an iframe inside of the element with the plan id you provided. Once the checkout is complete, the user will be redirected to the redirect url you specified in the settings on Whop.

You can configure the redirect url in your [whop's settings](https://whop.com/dashboard/whops/) or in your [company's settings](https://whop.com/dashboard/settings/checkout/) on the dashboard. If both are specified, the redirect url specified in the whop's settings will take precedence.

## Available methods

### **`submit`**

To submit checkout programmatically, you can use the `submit` method on the checkout element.
First, attach an `id` to the checkout container:

```md
<div id="whop-embedded-checkout" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

Then, you can submit the checkout by calling `wco.submit` with the id:

```js
wco.submit("whop-embedded-checkout");
```

### **`getEmail`**

To get the email of the user who is checking out, you can use the `getEmail` method on the checkout element.
First, attach an `id` to the checkout container:

```md
<div id="whop-embedded-checkout" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

Then, you can get the email by calling `wco.getEmail` with the id:

```js
const email = await wco.getEmail("whop-embedded-checkout");
console.log(email);
```

## Available attributes

### **`data-whop-checkout-plan-id`**

**Required** - The plan id you want to checkout.

> To get your plan id, you need to first create a plan in the **Manage Pricing** section on your whop page.

### **`data-whop-checkout-theme`**

**Optional** - The theme you want to use for the checkout.

Possible values are `light`, `dark` or `system`.

```md
<div data-whop-checkout-theme="light" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-theme-accent-color`**

**Optional** - The accent color to apply to the checkout embed

Possible values are
- `tomato`
- `red`
- `ruby` 
- `crimson`
- `pink`
- `plum`
- `purple`
- `violet`
- `iris`
- `cyan`
- `teal`
- `jade`
- `green`
- `grass`
- `brown`
- `blue`
- `orange`
- `indigo`
- `sky`
- `mint`
- `yellow`
- `amber`
- `lime`
- `lemon`
- `magenta`
- `gold`
- `bronze`
- `gray`

```md
<div data-whop-checkout-theme-accent-color="green" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-session`**

**Optional** - The session id to use for the checkout.

This can be used to attach metadata to a checkout by first creating a session through the API and then passing the session id to the checkout element.

```md
<div data-whop-checkout-session="ch_XXXXXXXXX" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-hide-price`**

**Optional** - Set to `true` to hide the price in the embedded checkout form.

Defaults to `false`

```md
<div data-whop-checkout-hide-price="true" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-hide-submit-button`**

**Optional** - Set to `true` to hide the submit button in the embedded checkout form.

Defaults to `false`

<Note>
  When using this Option, you will need to [programmatically submit](#submit)
  the checkout form.
</Note>

```md
<div data-whop-checkout-hide-submit-button="true" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-hide-tos`**

**Optional** - Set to `true` to hide the terms and conditions in the embedded checkout form.

Defaults to `false`

```md
<div data-whop-checkout-hide-tos="true" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-skip-redirect`**

**Optional** - Set to `true` to skip the final redirect and keep the top frame loaded.

Defaults to `false`

### **`data-whop-checkout-on-complete`**

**Optional** - The callback to call when the checkout succeed.

**Note** - This option will set `data-whop-checkout-skip-redirect` to `true`

```html
<script>
	window.onCheckoutComplete = (planId, receiptId) => {
		console.log(planId, receiptId);
	}
</script>

<div data-whop-checkout-on-complete="onCheckoutComplete" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

### **`data-whop-checkout-on-state-change`**

**Optional** - The callback to call when state of the checkout changes

This can be used when programmatically controlling the submit of the checkout embed.

```html
<script>
  window.onCheckoutStateChange = (state) => {
    console.log(state);
  };
</script>

<div
  data-whop-checkout-on-state-change="onCheckoutStateChange"
  data-whop-checkout-plan-id="plan_XXXXXXXXX"
></div>
```

### **`data-whop-checkout-skip-utm`**

By default any utm params from the main page will be forwarded to the checkout embed.

**Optional** - Set to `true` to prevent the automatic forwarding of utm parameters

Defaults to `false`

### **`data-whop-checkout-prefill-email`**

Used to prefill the email in the embedded checkout form. This setting can be helpful when integrating the embed into a funnel that collects the email prior to payment already.

```md
<div data-whop-checkout-prefill-email="example@domain.com" data-whop-checkout-plan-id="plan_XXXXXXXXX"></div>
```

## Full example

```md
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<script 
			async 
			defer 
  			src="https://js.whop.com/static/checkout/loader.js"
		></script>
		<title>Whop embedded checkout example</title>
		<style>
			div {
				box-sizing: border-box;
			}
			body {
				margin: 0
			}
		</style>
	</head>
	<body>
		<div
			data-whop-checkout-plan-id="plan_XXXXXXXXX"
			data-whop-checkout-session="ch_XXXXXXXXX"
			data-whop-checkout-theme="light"
			style="height: fit-content; overflow: hidden; max-width: 50%;"
		></div>
	</body>
</html>
```
