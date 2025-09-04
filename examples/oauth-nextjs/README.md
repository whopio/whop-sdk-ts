# Whop OAuth with next.js + auth.js (next-auth)

This example showcases how to set up Whop OAuth with a next.js app with the help of the auth.js framework.

## Prerequisites to run locally

1. Create an app on the [Whop dashboard](https://whop.com/dashboard/developer/)
2. Add `http://localhost:3000/api/auth/callback/whop` to your apps OAuth callback URLs
3. Create `.env.local` file and copy over the contents from `.env.example`
   1. Generate `AUTH_SECRET` for auth.js (`openssl rand --base64 32`)
   2. Copy the values for `NEXT_PUBLIC_WHOP_APP_ID` and `WHOP_API_KEY` from the Whop dashboard
