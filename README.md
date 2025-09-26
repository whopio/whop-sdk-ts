# Whop SDK TypeScript

## Development Setup

For developers running examples locally:

1. Install dependencies in the root: `pnpm i`
2. Pull protocol buffers: `./scripts/pull_protos.sh`
3. Build the project: `pnpm turbo build`
4. Navigate to the example you want to run: `cd examples/<example-name>`
5. Install example dependencies: `pnpm i`
6. Start the development server: `pnpm dev`
