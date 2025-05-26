---
title: Get a current user
description: Get the current user who is viewing your Whop App.
---




<CodeGroup>

```javascript @whop/api
import { hasAccess } from "@whop-apps/sdk";
import { headers } from "next/headers";

const { userId } = await verifyUserToken(headersList);

if (!userId) {
  return <p>You do not have access to view this page</p>;
}
```

```ruby Ruby on Rails
require 'jwt'
require 'openssl'

JWT_PEM = <<~PEM.freeze
  -----BEGIN PUBLIC KEY-----
  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErz8a8vxvexHC0TLT91g7llOdDOsN
  uYiGEfic4Qhni+HMfRBuUphOh7F3k8QgwZc9UlL0AHmyYqtbhL9NuJes6w==
  -----END PUBLIC KEY-----
PEM

# In your controller
user_token = request.headers["x-whop-user-token"]
return if user_token.blank?

key = OpenSSL::PKey::EC.new(JWT_PEM)
payload, _header = JWT.decode user_token, key, true, {
  iss: "urn:whopcom:exp-proxy",
  verify_iss: true,
  algorithm: "ES256"
}

jwt_app_id = payload["aud"]
return if jwt_app_id != ENV.fetch("WHOP_APP_ID")

jwt_user_id = payload["sub"]
```

```php PHP
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$JWT_PEM = <<<PEM
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErz8a8vxvexHC0TLT91g7llOdDOsN
uYiGEfic4Qhni+HMfRBuUphOh7F3k8QgwZc9UlL0AHmyYqtbhL9NuJes6w==
-----END PUBLIC KEY-----
PEM;

// In your route handler
$userToken = $_SERVER['HTTP_X_WHOP_USER_TOKEN'] ?? null;
if (!$userToken) return null;

try {
    $payload = JWT::decode($userToken, new Key($JWT_PEM, 'ES256'));

    if ($payload->iss !== 'urn:whopcom:exp-proxy') return null;
    if ($payload->aud !== $_ENV['WHOP_APP_ID']) return null;

    $jwtUserId = $payload->sub;
} catch (Exception $e) {
    return null;
}
```

```go Go
import (
    "github.com/golang-jwt/jwt/v5"
    "encoding/pem"
    "crypto/x509"
)

const JWT_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErz8a8vxvexHC0TLT91g7llOdDOsN
uYiGEfic4Qhni+HMfRBuUphOh7F3k8QgwZc9UlL0AHmyYqtbhL9NuJes6w==
-----END PUBLIC KEY-----`

// In your handler
userToken := r.Header.Get("x-whop-user-token")
if userToken == "" {
    return
}

block, _ := pem.Decode([]byte(JWT_PEM))
publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
if err != nil {
    return
}

token, err := jwt.Parse(userToken, func(token *jwt.Token) (interface{}, error) {
    if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    return publicKey, nil
})

if err != nil {
    return
}

claims, ok := token.Claims.(jwt.MapClaims)
if !ok {
    return
}

if claims["iss"] != "urn:whopcom:exp-proxy" {
    return
}

if claims["aud"] != os.Getenv("WHOP_APP_ID") {
    return
}

jwtUserId := claims["sub"].(string)
```

```python Python Flask
from flask import request
import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

JWT_PEM = """-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErz8a8vxvexHC0TLT91g7llOdDOsN
uYiGEfic4Qhni+HMfRBuUphOh7F3k8QgwZc9UlL0AHmyYqtbhL9NuJes6w==
-----END PUBLIC KEY-----"""

# In your route
@app.route('/your-route')
def your_route():
    user_token = request.headers.get('x-whop-user-token')
    if not user_token:
        return None

    try:
        public_key = serialization.load_pem_public_key(
            JWT_PEM.encode(),
            backend=default_backend()
        )

        payload = jwt.decode(
            user_token,
            public_key,
            algorithms=['ES256'],
            issuer='urn:whopcom:exp-proxy'
        )

        if payload['aud'] != os.environ['WHOP_APP_ID']:
            return None

        jwt_user_id = payload['sub']

    except jwt.InvalidTokenError:
        return None
```

</CodeGroup>


Now that you have a trustworthy user ID, you can check if they are an admin or customer, fetch their profile, or make calls on their behalf.

### Next Steps

- [Check a user's access](/sdk/validate-access)
