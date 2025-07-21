# @whop/api

## 0.0.39

### Patch Changes

- 31a2054: Change courses.getUserLessonInteractions query to use course id instead of experience id
- 5a44378: Add courses.moveCourse mutation. Add courses.listCoursesForCompany query

## 0.0.38

### Patch Changes

- 4b77b81: add courses.listCoursesForExperience query

## 0.0.37

### Patch Changes

- b531da4: Add courses mutations for creating, updating and deleting lessons and chapters

## 0.0.36

### Patch Changes

- 4bd6e46: Created initial react native package with build and ship cli

## 0.0.35

### Patch Changes

- b7181d2: Create courses.markLessonAsCompleted mutation. Add content to BasicCourseLesson fragment. Add lesson ids to courses.getUserLessonInteractions.

## 0.0.34

### Patch Changes

- e9486ac: Add additional fields to courses.getCourse. Create courses.getLesson, courses.getUserLessonInteractions.

## 0.0.33

### Patch Changes

- 44855e8: fix oauth url missing state

## 0.0.32

### Patch Changes

- b881027: Add getCourse query

## 0.0.31

### Patch Changes

- 7650fda: Added attachments to access pass

## 0.0.30

### Patch Changes

- e41599c: Added list access passes for experience endpoint

## 0.0.29

### Patch Changes

- 551144b: add `Decimal` to gql scalar defs

## 0.0.28

### Patch Changes

- afc4d5a: Added the ability to create app builds via the api

## 0.0.27

### Patch Changes

- b706f25: Added a create checkout session function to the payments methods to allow attaching metadata to plans for subscriptions.
- ef9ca4e: Removes extra input and output objects from the generated code. This will require some code changes for old clients but should make the DX much better by being less verbose and annoying. For example getUser now returns the user object directly without being nested in a "publicUser" field
- af9e71a: Organise all the api methods into groups for clarity and ease of use.
- 081dbc7: Updated the SDK to send the graphql operation names in the pathname

## 0.0.26

### Patch Changes

- f23cc24: add search query to the list users for experience endpoint
- bc3353e: add `oauth2` module to simplify oauth implementations

## 0.0.25

### Patch Changes

- 72caed1: Switched the SDK to use persisted graphql queries by operation id. Improves performance security and reduces network traffic.

## 0.0.24

### Patch Changes

- 1cd7d96: update .npmignore to include build configs

## 0.0.23

### Patch Changes

- 9d57bfe: chore(deps): update dependency ts-proto to v2.7.1
- a2809a2: chore(deps): update dependency turbo to v2.5.4
- 964850f: Added waitlist entries to the SDK along with if the user is phone verified and their location (if permitted).
- f8627a6: chore(deps): update dependency mintlify to v4.0.563
- ad76e87: Split the functions available on the client and server SDK such that you cannot call mutations and queries on the client that will always fail due to auth issues.

## 0.0.22

### Patch Changes

- e041ade: Add `balanceCaches.nodes.pendingBalance` field to `BaseLedgerAccount` fragment
- 482a7fa: add description and keywords
- 72f93fd: add repository field to package.json
- 7f33380: add bugs and homepage to package.json
- a97d6fa: add MIT license

## 0.0.21

### Patch Changes

- cb2da90: fix(deps): update dependency js-md5 to v0.8.3
- 116374a: chore(deps): update dependency yaml to v2.8.0
- ebded51: chore(deps): update dependency mintlify to v4.0.562
- 6330be2: release initial checkout package
- b406605: remove purchaseUrl from chargerUser because it should not be used

## 0.0.21-canary.8

### Patch Changes

- cb2da90: fix(deps): update dependency js-md5 to v0.8.3
- 116374a: chore(deps): update dependency yaml to v2.8.0
- b406605: remove purchaseUrl from chargerUser because it should not be used

## 0.0.21-canary.7

### Patch Changes

- 6330be2: release initial checkout package
