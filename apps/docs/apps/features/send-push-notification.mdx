---
title: Send push notification
description: Send a push notification to a user or a group of users.
---

## Send a notification to everyone in an experience.

<Info>
  Make sure you have [setup your whop SDK client on the
  server](/sdk/whop-api-client)
</Info>

```typescript
import { whopSdk } from "@/lib/whop-sdk";

// This could be a server action / api route that create a
// piece of content in your app for this experience
export async function createSomeContentInExperience(
  experienceId: string,
  content: string, // this could be a more complex type depending on your specific app.
  createdByUserId: string
) {
  // Create the content in your app.
  // ... await some database call etc etc...

  // Send a push notification to everyone in the experience.
  await whopSdk.notifications.sendPushNotification({
    title: "New content is available" /* Required! */,
    content: content.slice(0, 100) + "...", // Format the content as you wish.
    experienceId, // send to all users with access to this experience.

    isMention: false, // Set this to true to make everyone immediately
    // get a mobile push notification.

    senderUserId: createdByUserId, // This will render this user's
    // profile picture as the notification image.
  });
}
```

See the full list of accepted parameters [here](/sdk/api/notifications/send-push-notification).

## Adding a deeplink to the notification.

When you send a notification, you will usually want to send the user to specific section in your app upon clicking the notification.
You can do this by using the `restPath` property.

1. Update your app path in the dashboard to handle the additional parameters.

   In the hosting section, set the "App path" field to something like: `/experiences/[experienceId]/[restPath]`

2. In your `sendPushNotification` call, add the `restPath` property.

   ```typescript
   await whopSdk.notifications.sendPushNotification({
     title: "New content is available",
     content: content.slice(0, 100) + "...",
     experienceId,
     restPath: `/posts/${somePostId}`, // The specific posts route is just an example
     // You could also just add a query param like this:
     // restPath: `?id=${specialId}`,
   });
   ```

3. Update you app to handle the following route:

   When clicking on a notification, the user will open this specific url on your app within the whop iframe.

   ```
   https://your-domain.com/experiences/exp_123/posts/post_123
   ```

   If using NextJS, you can add a `page.tsx` file with the path: `app/experiences/[experienceId]/posts/[postId]/page.tsx`

   <Info>
     Note: the exact path will depend on the pathname structure you set in the
     `restPath` property.
   </Info>

## Sending a notification to company admins

Your app may want to alert company admins only, not all members. Use the `companyTeamId` field instead of the `experienceId` when sending the notification.

```typescript
await whopSdk.notifications.sendPushNotification({
  title: "A member just posted a new listing. Review it now.",
  content: `${listingTitle}`,
  companyTeamId,
});
```

<Info>
  You must send either the `companyTeamId` or the `experienceId` when sending a
  notification. Setting both will result in an error.
</Info>

## Sending a notification to a specific subset of users.

Use the `userIds` field to filter the users who will receive the notification.

Whop will first apply either the `experienceId` or the `companyTeamId` filter and then apply the `userIds` filter

Ensure that the `userIds` array contains valid user IDs that are part of the specified experience or company team.

For example if you a building a bidding app you may want to alert the highest bidder if they were just outbid.

```typescript
await whopSdk.notifications.sendPushNotification({
  title: "You were just outbid",
  content: `${listingTitle}`,
  experienceId, // the experience ID that the current item is listed within.
  userIds: [oldHighestBidderUserId],
});
```
