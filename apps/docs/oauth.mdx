---
title: Web Apps
description: "OAuth documentation guide"
---

OAuth is a protocol that acts like a digital key, allowing authorized access to certain parts of your web application. It acts as a doorman, checking if the user has the right credentials (proof of purchase) before letting them in.

<Note>
  This guide covers the process when a user tries to access your webapp from the
  **Whop Hub**. If you want to add in a **Login With Whop** button to your site,
  follow [this guide](/oauth/sign-in-button).
</Note>
---

## When to use OAuth

You should use OAuth if you have a website and want to allow users who have purchased your product on the **Whop** to access your site.

---

## Whop OAuth Examples

<CardGroup cols={2}>
  <Card
    title="Next.js"
    icon="react"
    color="#ea5a0c"
    href="https://github.com/whopio/next-template"
  >
    Whop OAuth in your Next.js app.
  </Card>
  <Card
    title="Electron"
    icon="react"
    color="#0285c7"
    href="https://github.com/denisulit/whop-electron-template"
  >
    Whop OAuth in your Electron desktop app.
  </Card>
</CardGroup>

---

## Adding a webapp to your product

Before we start, you should add a **webapp** experience to your product. You can do this by going to your **product** and clicking the **Webapp** option. From here you can add the name and the **Callback URL**. We will cover the steps to create one below.

![Webapp video](https://dev-docs-weld.vercel.app/Webapp.gif)

---

## OAuth Flow

Here is the flow for how OAuth works:

1. The user purchases your product
2. Your user clicks on a link to your application from the **Whop Hub**.
3. Your user is redirected to your application with a code in the **URL**.
4. Your application requests an **authorization token** from the Whop API by exchanging the code from the URL.
5. The Whop API returns an **authorization token**.
6. Your application uses the authorization token to request data about the authenticated user.

---

## Receiving a code

When your user tries to access your application from the Whop Hub, this is where they will be redirected.

```bash
https://your-site.xyz/callback/whop?code=xxxxxxxx
```

---

## Creating your callback

This is where your users will be redirected when they try to access your application from the Whop Hub. It will contain a URL parameter called `code`.

<CodeGroup title="Callback" >
    ```js JavaScript
    export default function Callback() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
    }
    ```

```python Python
from flask import Flask, request, redirect

app = Flask(**name**)

@app.route('/callback')
def callback():
  code = request.args.get('code')
```

```ruby Rails
class CallbacksController < ApplicationController
    def callback
        code = params[:code]
        # Use the code to request an authorization token
    end
end
```

</CodeGroup>

---

## Requesting an authorization token

Once you have received the code from the URL, you can use it to request an authorization token.

Here is the response, you will need the `access_token` to make requests to the API.

You will need to pass the `redirect_uri` value as part of the payload. This is the same URL as the **Callback URL** you set when creating your webapp.

<Note>
  Once you have received the token, we advise you to store it in cookies or the
  session so it can be accessed when needed.
</Note>

<CodeGroup>
    ```js JavaScript
    import axios from 'axios';

    const getAuthToken = async (code, clientId, clientSecret, redirect_uri) => {
        try {
            const response = await axios.post('https://api.whop.com/v5/oauth/token', {
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirect_uri
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    export default getAuthToken;
    ```

```python Python
import requests

def get_auth_token(code, client_id, client_secret, redirect_uri):
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri
    }
    response = requests.post('https://api.whop.com/v5/oauth/token', data=data)
    return response.json()
```

```ruby Rails
require 'net/http'
require 'uri'
require 'json'

def get_auth_token(code, client_id, client_secret, redirect_uri)
    uri = URI.parse('https://api.whop.com/v5/oauth/token')
    request = Net::HTTP::Post.new(uri)
    request.content_type = 'application/json'
    request.body = {
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri
    }.to_json
    req_options = {
        use_ssl: uri.scheme == 'https',
    }
    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
    end
    JSON.parse(response.body)
end
```

</CodeGroup>

---

## Fetching the user

Now that you have the authorization token, you can use it to fetch data about the user. To see more details about this endpoint, click [here](/api-reference/v5/me/token).

<CodeGroup>

```js JavaScript
import axios from "axios";

const checkAccess = async (accessToken) => {
  try {
    const response = await axios.get(`https://api.whop.com/v5/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default checkAccess;
```

```python Python
import requests

def check_access(access_token):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get('https://api.whop.com/v5/me', headers=headers)
    return response.json()
```

```ruby Rails
require 'net/http'
require 'uri'
require 'json'

def check_access(access_token)
    uri = URI.parse("https://api.whop.com/v5/me")
    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Bearer #{access_token}"
    req_options = {
        use_ssl: uri.scheme == "https",
    }
    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
    end
    JSON.parse(response.body)
end
```

</CodeGroup>

---

## Error Codes

| Code | Response Body                                                                                                                                                           | Description                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 400  | `The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.` | Check the code                                         |
| 401  | `Your access token is invalid. Please make sure you are passing an access token, and that it is correctly formatted.`                                                   | Your access token is invalid, try generating a new one |
| 404  | `Route {ROUTE} not found`                                                                                                                                               | Check the URL                                          |
