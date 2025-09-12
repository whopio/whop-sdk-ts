This is a [Whop React Native](https://docs.whop.com/apps/tutorials/react-native) project bootstrapped with `create @whop/react-native`.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

> There is an `.env.example` in the root directory you can use for reference
```bash
cp .env.example .env.local
```

```
WHOP_API_KEY=your_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
```

Get these credentials from the [Whop Developer Dashboard](https://whop.com/dashboard/developer):
1. Go to the Whop Developer Dashboard
2. Create a new app or select an existing one
3. Copy the environment variables from the app settings

### 3. Deploy a development build 

```bash
pnpm ship
```

### 4. Install the app into your whop and preview it on your phone
```bash
pnpm preview
```

## Deploy to production

1. Go to the [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Navigate to your app's builds section
3. Promote your development build to production
4. Your app is now live for all users!

## Learn More
To learn more about building Whop apps, take a look at the following resources:

- [Documentation](https://docs.whop.com/apps) - learn about Whop apps.
- [Developer whop](https://whop.com/developers) - join the developer whop.