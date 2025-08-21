# Whop Checkout React 18 Test App

A minimal React 18 application to test the `@whop/checkout` React component.

## Features

- ✅ React 18 with modern `createRoot` API
- ✅ TypeScript support
- ✅ Tests `WhopCheckoutEmbed` component
- ✅ Tests ref forwarding and controls
- ✅ Tests event handling
- ✅ Vite for fast development

## Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm check-types

# Build for production
pnpm build
```

## Testing

The app provides:

1. **Visual Test**: Checkout embed renders correctly
2. **Controls Test**: Buttons to test embed controls
3. **Events Test**: Console logs for checkout events
4. **React 18 Compatibility**: Uses modern React 18 APIs

## What it Tests

- `WhopCheckoutEmbed` component rendering
- `useCheckoutEmbedControls` hook functionality
- Ref forwarding with `React.forwardRef`
- `setEmail()`, `getEmail()`, `submit()` methods
- `onComplete` and `onStateChange` event handling
- React 18 concurrent features compatibility
- TypeScript integration with React 18+ types

## Architecture

- **React 18**: Modern React with concurrent features
- **TypeScript**: Full type safety
- **Vite**: Fast bundler with HMR
- **Workspace Dependency**: Uses local `@whop/checkout` package
