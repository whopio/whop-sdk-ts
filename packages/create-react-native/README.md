# @whop/create-react-native

A powerful CLI tool to bootstrap your Whop React Native projects with best practices and latest dependencies.

## Usage

```bash
npx @whop/create-react-native
```

Or using pnpm:

```bash
pnpm create @whop/react-native
```

## Features

- 🚀 **Interactive Setup** - Guided project creation with customizable options
- 📦 **Latest Dependencies** - Automatically fetches and uses the latest versions of React, TypeScript, and Whop SDK
- 🔧 **Environment Configuration** - Built-in environment variable setup with Whop dashboard integration
- 📁 **Smart Project Structure** - Creates well-organized project structure from battle-tested template
- ✨ **Developer Experience** - Beautiful CLI with progress indicators and helpful instructions
- 🛡️ **Error Handling** - Comprehensive error handling and validation

## What It Creates

The CLI creates a new React Native project with:

- **Modern Dependencies**: Latest React, TypeScript, and @whop/react-native
- **Build Scripts**: Pre-configured build, upload, clean, and ship commands
- **Environment Setup**: Automated .env.local creation with your Whop app credentials
- **Project Structure**: Organized source code with views and components
- **TypeScript Config**: Optimized TypeScript configuration for React Native
- **Git Integration**: Pre-configured .gitignore with common exclusions

## Interactive Prompts

1. **Project Name**: Choose your project name (automatically normalized for file systems)
2. **Description**: Optional project description
3. **Author**: Your name for package.json
4. **Environment Variables**: Paste your Whop app credentials from the dashboard

## Next Steps

After creation, the CLI provides clear instructions:

```bash
cd your-project-name
pnpm ship
```

This will build and deploy your app to see it working immediately!

## Available Commands

Once your project is created, you can use these commands:

- `pnpm build` - Build your app
- `pnpm upload` - Upload to Whop
- `pnpm clean` - Clean build files  
- `pnpm ship` - Build and upload in one command

## Requirements

- Node.js 18 or higher
- pnpm package manager

## Getting Whop Credentials

1. Visit [https://whop.com/dashboard/developer](https://whop.com/dashboard/developer)
2. Create a new app or select an existing one
3. Copy the environment variables from the app settings
4. Paste them when prompted by the CLI

## License

MIT

