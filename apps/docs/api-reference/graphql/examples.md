---
title: "Examples"
icon: key
---

Here are some useful queries and their implementations to get you started in Next.JS, Swift, or Python:

### Get messages from a direct message feed

```graphql
query DmsFeedData($feedId: ID!, $postsLimit: Int!) {
  dmsFeedData(feedId: $feedId, postsLimit: $postsLimit) {
    posts {
      content
      user {
        username
        id
      }
    }
  }
}
```

### Get current user information

```graphql
query myCurrentUser {
  viewer {
    user {
      id
      username
      name
      email
    }
  }
}
```

### Send chat message

```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input)
}
```

### Create a forum post

```graphql
mutation CreateForumPost($input: CreateForumPostInput!) {
  createForumPost(input: $input) {
    # You can specify return fields here if needed
  }
}
```

### Get whops from discover

```graphql
query DiscoverySearch($query: String!) {
  discoverySearch(query: $query) {
    accessPasses {
      title
      route
      headline
      logo {
        sourceUrl
      }
    }
  }
}
```

## Implementation Examples

### Python (using requests)

```python
import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "x-on-behalf-of": "user_123",
    "x-company-id": "biz_123",
    "Content-Type": "application/json"
}

# Example: Fetching DMs
full_query = """query DmsFeedData($feedId: ID!, $postsLimit: Int!) {
    dmsFeedData(feedId: $feedId, postsLimit: $postsLimit) {
        posts {
            content
            user {
                username
                id
            }
        }
    }
}"""

payload = {
    "query": full_query,
    "variables": {
        "feedId": "your_feed_id",
        "postsLimit": 1
    }
}

response = requests.post(
    "https://api.whop.com/public-graphql",
    headers=headers,
    json=payload
)
response_json = response.json()
```

### Next.js (using Apollo Client)

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { gql } from "@apollo/client";

// Create HTTP link
const httpLink = createHttpLink({
  uri: "https://api.whop.com/public-graphql",
});

// Add auth headers
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer YOUR_API_KEY`,
      "x-on-behalf-of": "user_123",
      "x-company-id": "biz_123",
    },
  };
});

// Create Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Example: Discovery Search
const DISCOVERY_SEARCH = gql`
  query DiscoverySearch($query: String!) {
    discoverySearch(query: $query) {
      accessPasses {
        title
        route
        headline
        logo {
          sourceUrl
        }
      }
    }
  }
`;

// Usage
client
  .query({
    query: DISCOVERY_SEARCH,
    variables: { query: "search_term" },
  })
  .then((result) => console.log(result));
```

### Swift (using Apollo iOS)

```swift
import Apollo

// Configure Apollo Client
let url = URL(string: "https://api.whop.com/public-graphql")!

let store = ApolloStore()
let transport = RequestChainNetworkTransport(
    interceptorProvider: DefaultInterceptorProvider(store: store),
    endpointURL: url,
    additionalHeaders: [
        "Authorization": "Bearer YOUR_API_KEY",
        "x-on-behalf-of": "user_123",
        "x-company-id": "biz_123"
    ]
)

let client = ApolloClient(networkTransport: transport, store: store)

// Example: Get Current User
let getCurrentUser = """
query myCurrentUser {
  viewer {
    user {
      id
      username
      name
      email
    }
  }
}
"""

client.fetch(query: getCurrentUser) { result in
    switch result {
    case .success(let graphQLResult):
        print("Success! Result: \(graphQLResult)")
    case .failure(let error):
        print("Failure! Error: \(error)")
    }
}
```

These examples demonstrate basic usage of the Whop GraphQL API across different platforms. Remember to replace placeholder values (YOUR_API_KEY, user_123, etc.) with your actual credentials.
