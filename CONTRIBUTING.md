# Contributing to the Whop TypeScript monorepo

## Guidelines

TODO

## Local Development

TODO

## Changelogs

### Creating Changesets

When making changes to any package in the repository (excluding documentation-only changes), you must include a changeset in your PR. Changesets help us track and document changes for our changelog and version management.

To create a changeset:

1. Run `pnpm changeset` in your terminal
2. Follow the interactive prompts:
   - Select the packages that have changed
   - Choose the type of version bump (patch, minor, or major)
   - Write a clear description of your changes
3. Commit the generated `.changeset` file to your PR branch

### Changeset Guidelines

- **Be Specific**: Write clear, concise descriptions of your changes
- **Include Context**: Mention why the change was made if relevant
- **Link Issues**: Reference related issue numbers if applicable
- **Breaking Changes**: Clearly mark any breaking changes in your description

### Version Bumps

- **Patch** (0.0.x): For backwards-compatible bug fixes
- **Minor** (0.x.0): For new backwards-compatible features
- **Major** (x.0.0): For breaking changes

### Review Process

Changesets will be reviewed as part of the PR process. The maintainers will ensure that:
- The version bump is appropriate for the changes
- The description is clear and helpful
- All necessary packages are included
