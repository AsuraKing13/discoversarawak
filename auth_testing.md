# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('discover_sarawak');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: visitorId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + visitorId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://tourism-hub-12.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints (favorites)
curl -X GET "https://tourism-hub-12.preview.emergentagent.com/api/favorites/YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test itinerary generation with auth
curl -X POST "https://tourism-hub-12.preview.emergentagent.com/api/itinerary/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"interests": ["Culture", "Nature"], "duration": 3, "budget": "medium", "user_id": "YOUR_USER_ID"}'
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.addCookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "discover-sarawak.preview.emergentagent.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
await page.goto("https://tourism-hub-12.preview.emergentagent.com");
```

## MongoDB ID Handling Rules
- Use custom `user_id` field and ignore MongoDB's `_id`
- Always exclude `_id` from queries with `{"_id": 0}`
- User document has `user_id` field (custom ID, not MongoDB's _id)
- Session `user_id` matches `users.user_id` exactly

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('discover_sarawak');
db.users.find().limit(2).pretty();
db.user_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('discover_sarawak');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] User document has `user_id` field (custom ID, not MongoDB's _id)
- [ ] Session `user_id` matches `users.user_id` exactly
- [ ] All queries exclude `_id` with `{"_id": 0}`
- [ ] Pydantic models use `user_id: str` (no aliases needed)
- [ ] API returns user data (not 401/404)
- [ ] Mobile app loads authenticated screens (not login screen)

## Success Indicators
- `/api/auth/me` returns user data with `user_id` field
- App loads without redirect to login
- Favorites and itineraries work with authenticated user

## Failure Indicators
- "User not found" errors
- 401 Unauthorized responses
- Redirect to login page on protected routes
