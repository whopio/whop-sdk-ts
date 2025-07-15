import { WhopClientSdk } from "@whop/api";
import { NativeWhopCore } from "./native-whop-core";

interface BaseViewProps {
	currentUserId: string | undefined | null;
	restPath: string | undefined | null;
}

export interface ExperienceViewProps extends BaseViewProps {
	experienceId: string;
	companyId: string;
}

export interface DiscoverViewProps extends BaseViewProps {}

export const whopSdk: WhopClientSdk = WhopClientSdk({
	apiOrigin: `https://${NativeWhopCore.getConstants().apiHost}`,
	apiPath: "/_whop/public-graphql/",
});

/*

1. Template repo
2. Script to create the template repo
3. @whop/react-native package
4. Build script to bundle the package
5. Publish script to upload the bundle to whop api and create a new version.

Template repo:
- tsconfig.json
- biome.jsonc
- package.json
- .gitignore
- src/views/experience-view.tsx
- src/views/discover-view.tsx

pnpm @whop/react-native deploy 
- find the views in the src/views directory.
- create a `build` directory with `build/ios`, `build/android`, `build/web`
- copy the template "index.ios.tsx" to `build/ios/index.tsx` etc...
- run the react-native build command (metro bundler)
- build the app. (for each platform) 
- upload the build to the whop api. (using ENV vars for auth)

@whop/react-native package needs to contain: 
- src/cli
- src/frosted-ui
- src/entrypoints (ios, android, web)
- src/sdk - config for the whop api (client side) + utils
- src/types - prop types, etc... (maybe in sdk)

@whop/create-react-native repo needs 
- template/...
- bin/create-react-native
*/
