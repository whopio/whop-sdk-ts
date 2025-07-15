---
title: "AI car customizer"
description: "Build a GPT-powered car modification app and creators will be able to install it to their whops"
---

<Tip>
  This tutorial was submitted by
  [@AbdullahZHD](https://whop.com/@abdullahzahid), a member of the Whop
  Developers community. [Submit your own tutorial](https://whop.com/developer)
  and get paid real $!
</Tip>

## Summary

This tutorial will guide you through building a car modification AI app using Next.js, Shadcn UI, and OpenAI.

View the final product [here](https://whop.com/apps/app_S42iB0COVVUVwO/install/) by installing the app to your whop.

## 1. Set up your Next.js project

Clone the Car Modification AI repository:

```bash
git clone https://github.com/AbdullahZHD/car-modification-ai-whop
cd car-modification-ai-whop
```

Install dependencies:

<CodeGroup>
```bash pnpm
pnpm i
```

```bash npm
npm i
```

```bash yarn
yarn i
```

</CodeGroup>

## 2. Get your Whop API credentials

<Steps>
  <Step title="Create a Whop App">
    1. Go to [https://whop.com/dashboard](https://whop.com/dashboard)
    2. Navigate to **Developer**
    3. Click the **Create App** button
    4. Give your app a name like "Car Modification AI"
    5. Click **Create**
  </Step>

  <Step title="Get your API Key, Agent User ID, and App ID">
    After creating your app:
    1. Copy the **App API Key** - you'll need this for `WHOP_API_KEY`
    2. Copy the **Agent User ID** - you'll need this for `WHOP_AGENT_USER_ID`
    3. Copy the **App ID** - you'll need this for `WHOP_APP_ID`

    <Note>
      The Agent User ID is what allows your app's agent to send post the results in forum.
    </Note>

  </Step>
</Steps>

## 3. Get OpenAI API Key

<Steps>
  <Step title="Create OpenAI Account">
    1. Go to [platform.openai.com](https://platform.openai.com/)
    2. Click **Sign In** or **Sign Up**
    3. Complete the registration process
  </Step>

  <Step title="Get API Key">
    1. Go to **API Keys** in the dashboard
    2. Click **Create Key**
    3. Give it a name like **"Car Modification AI"**
    4. Copy the API key - you'll need this for `OPENAI_API_KEY` (ensure you have balance/payment method)

  </Step>
</Steps>

## 5. Configure Environment Variables

<Steps>
  <Step title="Create local environment file">
    ```bash
    touch .env.local
    ```
  </Step>

  <Step title="Fill in Required Variables">
    Open `.env` in your text editor and fill in these required fields:

    ```env
    # AI Service Configuration (Required)
    OPENAI_API_KEY=your_openai_api_key

    # Whop Integration (Required)
    WHOP_API_KEY=your_whop_api_key_here
    NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_whop_agent_user_id_here
    NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
    ```

  </Step>
</Steps>

## 7. Install Whop Dev Proxy

For Whop integration to work in development, you need to install the Whop dev proxy globally:

```bash
npm install @whop-apps/dev-proxy -g
```

<Note>
  The Whop dev proxy is required for the iframe integration to work properly
  during development.
</Note>

## 8. Run the Application

**Lets start the Web Server with Whop Proxy**.
Run this command to start both the Whop proxy and Next.js development server:

```bash
whop-proxy --command 'npx next dev --turbopack'
```

You should see output indicating both the proxy and Next.js are running. The web app will be available at [http://localhost:3000](http://localhost:3000)

{" "}

<Warning>
  Do NOT use `npm run dev` alone - it won't include the Whop proxy and the
  iframe integration won't work!
</Warning>

## 9. Configure App Settings in Whop

**Important**: You must configure these settings BEFORE installing the app to your community.

<Steps>
  <Step title="Set Base URL and App Path">
    1. Go to your Whop app dashboard → **Developer** → Your App
    2. In the **Hosting** section, configure:
       - **Base URL**: `http://localhost:3000/`
       - **App path**: `/experiences/[experienceId]`
    3. Click **Save** to update the settings

    <Warning>
      If you skip this step, the app installation and iframe integration won't work properly!
    </Warning>

  </Step>
</Steps>

## 10. Accessing the app (locally)

<Steps>
  <Step title="Access the application via Whop iframe">
    1. After installing the app, click **Open Whop** in the top right 2. When
    redirected to Whop, click the **Settings** button 3. Change the dropdown
    from **Production** to **Localhost** 4. Choose your port (usually **3000**)
    5. You'll now see the app running in Localhost.
  </Step>
</Steps>

## 11. Deploy to Vercel

Now let's deploy your car modification AI app to production so users can access it from anywhere.

**Push your code to GitHub**

First, commit all your changes and push to GitHub:

```bash
git add .
git commit -m "Complete car modification AI app"
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

**Create and deploy on Vercel**

<Steps>
  <Step title="Create a new project on Vercel">
    Go to [vercel.com](https://vercel.com) and click "New Project"
  </Step>

<Step title="Import your GitHub repository">
  Connect your GitHub account and import the repository containing your car
  modification app
</Step>

  <Step title="Add environment variables">
    In the Vercel deployment settings, add all your environment variables:

    ```env
    # AI Service Configuration (Required)
    OPENAI_API_KEY=your_openai_api_key

    # Whop Integration (Required)
    WHOP_API_KEY=your_whop_api_key_here
    NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_whop_agent_user_id_here
    NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
    ```

  </Step>

<Step title="Deploy">Click "Deploy" and wait for the build to complete</Step>

  <Step title="Copy your Vercel URL">
    Once deployed, copy your production URL (e.g., `https://your-app.vercel.app`)
  </Step>
</Steps>

**Update your Whop app settings**

<Steps>
  <Step title="Open Whop Developer Settings">
    Go to Whop dashboard and navigate to your app's settings in the developer panel
  </Step>

    <Step title="Update Base URL">
    In the "App Settings" section, change the Base URL from
    `http://localhost:3000` to your Vercel URL: `https://your-app.vercel.app`
    </Step>

  <Step title="Save and test">
    Save the changes and test your app installation to ensure production mode is working (by switching to **Production** in the iframe)
  </Step>
</Steps>

<Warning>
  **Vercel Timeout Limitation**: Vercel functions automatically timeout after 60
  seconds on a hobby account. AI image generation might take longer than 60
  seconds, which may cause errors. You can upgrade to a paid Vercel account to
  extend timeout limits.
</Warning>

## 12. Install to Your Whop Community

<Steps>
  <Step title="Install the App">
    1. Go to your Whop company dashboard 2. Navigate to **Settings** → **API
    keys** 3. Click on your Car Modification AI app (or whatever name you gave
    it) 4. Find and copy the **Installation Link** 5. Visit the installation
    link and grant the necessary permissions
  </Step>
</Steps>

## Troubleshooting

<AccordionGroup>
  <Accordion title="AI responses not working">
    1. Verify your OpenAI API key is correct
    3. Verify you have balance in the OpenAI Developer account
  </Accordion>

{" "}

<Accordion title="Expected car modification not happening">
  1. Ensure you use a high quality image with a car in it 2. Use a clear prompt,
  such as "add a spoiler to this car"
</Accordion>

  <Accordion title="Can't access in Localhost">
    1. Make sure you're using the Whop iframe method
    2. Ensure you've set the environment to localhost with correct port
    3. Check that your Whop App API key is correct, and all other environment variables as well
  </Accordion>
</AccordionGroup>

## Need Help?

- Join the [Developer Whop](https://whop.com/developers)
- View the source code of this app [here](https://github.com/AbdullahZHD/car-modification-ai-whop)
- DM [@AbdullahZHD on Whop](https://whop.com/@abdullahzahid)

---
