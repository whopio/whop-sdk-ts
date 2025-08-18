---
title: Local development
description: Run your local setup inside of a Whop iFrame with the Whop proxy
---

If you are building a Whop app inside of our website, you can use this proxy to run your local setup inside of a Whop iFrame.
You can use this proxy with any application written in any language and any framework.

## NextJS / Javascript app

1. Add the proxy as a dev dependency.

<CodeGroup>

```bash pnpm
pnpm add -D @whop-apps/dev-proxy
```

```bash npm
npm install -D @whop-apps/dev-proxy
```

```bash yarn
yarn add -D @whop-apps/dev-proxy
```

</CodeGroup>

2. Update your `package.json` dev script to include the proxy.

```json
"scripts": {
	"dev": "whop-proxy --command 'next dev --turbopack'",
}
```

> You can update the dev command to match your framework requirements.
> You can also other commands wrapped by the proxy in a similar way.

3. Run the proxy.

<CodeGroup>

```bash pnpm
pnpm dev
```

```bash npm
npm run dev
```

```bash yarn
yarn dev
```

</CodeGroup>

## Standalone mode (other frameworks)

1. Run you app on your local machine on some port, for example 5000.

2. Run the proxy in standalone mode.

<CodeGroup>

```bash pnpm
pnpm dlx @whop-apps/dev-proxy --standalone --upstreamPort=5000 --proxyPort=3000
```

```bash npm
npx @whop-apps/dev-proxy --standalone --upstreamPort=5000 --proxyPort=3000
```

```bash yarn
yarn dlx @whop-apps/dev-proxy --standalone --upstreamPort=5000 --proxyPort=3000
```

</CodeGroup>

<Note>
  This will run the proxy as an independent process. It will start a server on
  port 3000 and forward requests to port 5000 and append the user token in the
  headers.
</Note>

## Proxy Command Options

The proxy can be configured using the following command line options:

```bash
Usage: pnpm dlx @whop-apps/dev-proxy [options]

Options:

--proxyPort <port>      The port the proxy should listen on (3000 by default)
--upstreamPort <port>   The port the upstream server is listening on (set automatically by default)
--npmCommand <command>  The npm command to run to start the upstream server (dev by default)
--command <command>     The command to run to start the upstream server (npm run dev by default)
--standalone            Run the proxy as an independent process proxying requests from one port to another port. Ignores the command / npmCommand options.
```
