# Whop SDK

Whop SDK to help developers build on the Whop API!

Published on [GitHub](https://github.com/whopio/whop-sdk-ts)

The purpose of this is to allow developers to access the Whop API quickly and easily. Make sure you are signed up for a [Whop seller account](https://dash.whop.com/) and have properly completed all steps required before continuing.

If you are looking for a quick and easy way to setup your web application, without the hassle of setting up a new environment, check out our [Next Template](https://github.com/whopio/next-template)

## Directory

- [Before Installation](#before-installation)
- [Getting Started](#getting-started-with-the-whopapi)
- [Company Services](#company-services)
  - [Get All Products](#get-your-companys-products)
  - [Get A Specific Product](#get-a-specific-product)
  - [Get Reviews](#get-your-companys-reviews)
- [User Services](#user-services)
  - [Check User's Access](#check-users-access)
  - [Check User's Products](#check-a-users-products)
- [Examples](#examples)

## Before Installation

Make sure you are on the latest version of Node.js. If not download the latest version [here]("https://nodejs.org/en/").

In addition to Node JS, make sure to have the latest version of TypeScript installed by running the command:

> ```bash
> npm install typescript --save-dev
> ```

To begin using the Whop SDK install the required packages:

> ```bash
> npm install @whop-sdk/core --save-dev
> ```

**NOTE:** If you are a new to programming or just interested in creating your app using NextJS and Vercel, we highly recommend you create your web application using our template. Check it out on GitHub [here](https://github.com/whopio/next-template). This documentation will focus on creating your web application without a built-in platform like Vercel and framework like Next (while still utilizing the Whop API).

Once installed, make sure to retrieve your Whop OAuth credentials (Client ID and Client Secret), and API Key from your [Whop Developer Settings](https://dash.whop.com/settings/developer). You will also need to have created a Product on the Dashboard, more information can be found [here](https://docs.whop.com/creating-company#creating-your-first-product).

Now, create a `.env` file in your project's ROOT directory. Within the `.env` file, you can store all of your more sensitive environment variables (like OAuth credentials, API keys, or database URLs). The format should look similiar to this:

```
// .env file
// Found on 'https://dash.whop.com/settings/developer' under 'API Keys' and 'OAuth2 Setup'

WHOP_CLIENT_ID="XYVZVMzCEN......."
WHOP_CLIENT_SECRET="DO7js19JRp......."
WHOP_API_KEY="pfijRtaYTN......."
```

## Getting Started with the WhopAPI

To initialize the Whop SDK, pass your Whop's API COMPANY token. This can be found in the developer tab in the settings page under 'API Keys'. This will give access to functions such as retrieving access products and plans.

```Javascript
import { WhopSDK } from "@whop-sdk/core";

// Initializing the WhopApi SDK with the 'sdk' variable
const sdk = new WhopSDK({
  // Import your WHOP_API_KEY from your .env file
  TOKEN: process.env.WHOP_API_KEY,
});

// Recommended to export the function so that it can be quickly and easily used elsewhere
export default sdk;
```

## Company Services

### Get your Company's Products

(Formally known as 'Passes') This will return an array of product objects.

```Javascript
// const sdk = new WhopSDK({ TOKEN: session.accessToken }).products
const products = (await sdk?.listProducts({
  // Optional Arguments
  // The page number to retrieve
  page: number,
  // The number of resources to return per page
  per: number,
  // The visibility of the Product
  visibility: 'visible' | 'hidden' | 'archived' | 'quick_link',
})).data
// products: Array<AccessPass>
/*
  [
    {
      id: ...,
      name: ...,
      visibility: ...,
      created_at: ...,
    }, ...
  ]
*/

```

### Get a specific product

In case you wish to just show off a specific product, you can call the `retrieveProduct` and pass your product id.

```Javascript
const product = (await sdk?.retrieveProduct({
  // The ID of the Product, which will look like `prod_*************` or `pass_*************`
  id: "PRODUCT_ID"
}))
```

### Get your Company's Reviews

Get your companies reviews with this one simple call to `listReviews`. Use this to show off how great your product is!

```Javascript
// const sdk = new WhopSDK({ TOKEN: session.accessToken }).reviews

const reviews = (await sdk?.listReviews({}))?.data
// reviews: Array<Review>
/*
[
  {
    id: ...,
    user: ...,
  }, ...
] */
```

## User Services

### Fetching Users

Users are anyone that have registered Whop accounts. They are not always customers. Users are represents by the `User` type, defined in TypeScript:

```Javascript
type User = {
  // The ID of the User, which will look like `user_*************`
  id?: string;
  // The User's Whop username
  username?: string;
  // The User's email address
  email?: string;
  // An image URL of the User's profile photo, primarily pulled from Discord
  profile_pic_url?: string;
  social_accounts?: SocialAccount;
};
```

### Check User's Access

To quickly and easily check a Users access to your company or specific product, you can call `hasAccess`.

```Javascript
import type { UserService } from "@whop-sdk/core/node/services/UserService";

// sdk: UserService

const access = await sdk?.hasAccess({
  // The ID of the resource to check access for: a company (with ID like `biz_**************`), a product (with ID like `prod_**************` or `pass_*************`), or an experience (with ID like `exp_**************`)
  resourceId: "RESOURCE_ID"
})
```

### Check a User's Products

To check the memberships that a user has, call the UserService's `listUsersMemberships`. This can be used to get if a user owns a particular pass in order to gain access to a portion of your website.

```Javascript
import type { UserService } from "@whop-sdk/core/node/services/UserService";

// sdk: UserService
const memberships = (await sdk?.listUsersMemberships({
  // Whether or not the Membership has a valid status
  valid: true
})).data;
// memberships: Array<AccessPass>
```

See [Example](#checking-if-a-user-owns-required-pass) of this in action!

## Examples

### Checking if a User owns required pass

```Javascript
import type { UserService } from "@whop-sdk/core/node/services/UserService";

// allowedProducts ex: prod_******** / pass_********
const findPass = async (sdk: UserService, allowedProducts: string | string[]) => {
  if (typeof allowedProducts === "string") allowedProducts = [allowedProducts];
  const memberships = (await sdk.listUsersMemberships({ valid: true })).data;
  return (
    memberships?.find(
      (membership) =>
        membership.access_pass && allowedProducts.includes(membership.access_pass)
    ) || null
  );
};

export default findPass;
```

## Documention

If you have more questions about the Whop SDK or for more information and documentation, please visit https://docs.whop.com/

## Contributing

If you would like to contribute to the package, please submit a pull request with a detailed explanation of your changes. For bug reports, please open an issue on GitHub.
