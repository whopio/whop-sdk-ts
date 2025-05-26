---
title: Check Access
description: Check if a user has access to an experience
---

## Usage

You can check if a user has access to an experience using either the @whop/api package or by making a GraphQL query directly.

<CodeGroup>

```javascript @whop/api
import { WhopAPI } from "@whop-apps/sdk";

// First get the user ID using verifyUserToken
const { userId } = await verifyUserToken(headersList);

// Then check if they have access to the experience
const hasAccess = await WhopAPI.app().hasAccessToExperience({
  userId,
  experienceId: "exp_XXXX"
});

if (!hasAccess.hasAccess) {
  return <p>You do not have access to this experience</p>;
}
```

```ruby Ruby on Rails
require 'typhoeus'

def check_access(user_id, experience_id)
  response = Typhoeus.post(
    "https://api.whop.com/public-graphql",
    headers: {
      "Authorization" => "Bearer #{ENV.fetch('WHOP_API_KEY')}",
      "Content-Type" => "application/json"
    },
    body: {
      operationName: "CheckIfUserHasAccessToExperience",
      variables: {
        experienceId: experience_id,
        userId: user_id
      }
    }.to_json
  )

  if response.success?
    JSON.parse(response.body)["data"]["hasAccessToExperience"]
  else
    raise ServiceError, "Failed to check access: #{response.body}"
  end
end
```

```php PHP
use GuzzleHttp\Client;

function checkAccess($userId, $experienceId) {
    $client = new Client();

    $response = $client->post('https://api.whop.com/public-graphql', [
        'headers' => [
            'Authorization' => 'Bearer ' . $_ENV['WHOP_API_KEY'],
            'Content-Type' => 'application/json'
        ],
        'json' => [
            'operationName' => "CheckIfUserHasAccessToExperience",
            'variables' => [
                'experienceId' => $experienceId,
                'userId' => $userId
            ]
        ]
    ]);

    $result = json_decode($response->getBody(), true);
    return $result['data']['hasAccessToExperience'];
}
```

```go Go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
)

type GraphQLRequest struct {
    OperationName string                 `json:"operationName"`
    Variables     map[string]interface{} `json:"variables"`
}

type AccessResponse struct {
    Data struct {
        HasAccessToExperience struct {
            HasAccess   bool   `json:"hasAccess"`
            AccessLevel string `json:"accessLevel"`
        } `json:"hasAccessToExperience"`
    } `json:"data"`
}

func checkAccess(userID, experienceID string) (*AccessResponse, error) {
    reqBody := GraphQLRequest{
        OperationName: "CheckIfUserHasAccessToExperience",
        Variables: map[string]interface{}{
            "experienceId": experienceID,
            "userId":      userID,
        },
    }

    jsonBody, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("POST", "https://api.whop.com/public-graphql", bytes.NewBuffer(jsonBody))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+os.Getenv("WHOP_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result AccessResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}
```

```python Python
import os
import requests

def check_access(user_id: str, experience_id: str) -> dict:
    response = requests.post(
        'https://api.whop.com/public-graphql',
        json={
            'operationName': "CheckIfUserHasAccessToExperience",
            'variables': {
                'experienceId': experience_id,
                'userId': user_id
            }
        },
        headers={
            'Authorization': f'Bearer {os.environ["WHOP_API_KEY"]}',
            'Content-Type': 'application/json'
        }
    )

    response.raise_for_status()
    return response.json()['data']['hasAccessToExperience']
```

```curl cURL
curl --location 'https://api.whop.com/public-graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--data '{
    "operationName": "CheckIfUserHasAccessToExperience",
    "variables": {
        "experienceId": "exp_123",
        "userId": "user_123"
    }
}'
```

</CodeGroup>

## Response

The response will include whether the user has access and their access level:

```json
{
  "hasAccess": true,
  "accessLevel": "admin"
}
```

### Access Levels

- `admin`: The user is an admin of the experience
- `customer`: The user is a customer of the experience
- `no_access`: The user has no access to the experience

### Next Steps

- [Get current user](/sdk/current-user)
- [Look at the endpoints](/sdk/api)
