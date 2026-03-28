# Login Issue Debugging Guide

## Step-by-Step Debug

### 1. **Restart the backend with the fix**
```bash
# Stop the current backend server (Ctrl+C)
# Then in project root:
python manage.py runserver
```

Wait for: `Starting development server at http://127.0.0.1:8000/`

---

### 2. **Open Browser DevTools** (Press F12)
- Go to **Network** tab
- Keep it open before attempting login

---

### 3. **Try to Login**
- Go to http://localhost:5173
- Click "Sign up" and create account, OR use an existing account
- Click "Sign In"
- Enter your credentials
- Click "Sign In"

---

### 4. **Check Network Tab**
Look for a request named `login/` with status:

#### **✅ If Status is 200 (Success)**
- Click the request
- Click **Response** tab
- You should see:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your_email@example.com"
  }
}
```

If you see this → **Go to Step 5**

#### **❌ If Status is 400 or 401**
- Click Response tab
- Tell me exactly what error message you see
- Examples:
  - `{"non_field_errors": ["Invalid credentials"]}`
  - `{"detail": "Invalid username or password"}`
  - `{"username": ["This field may not be blank."]}`

---

### 5. **Check Console Tab in DevTools**
- Click **Console** tab
- Should be no red errors
- If you see errors, screenshot them

---

### 6. **Check Login Response is Stored**
In **Console** tab, paste:
```javascript
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
console.log('User:', localStorage.getItem('user'));
```

You should see tokens and user data printed.

---

### 7. **If Everything Looks Good but Still Redirected**
The problem might be in AuthContext. Paste this in Console:
```javascript
// Check if user is detected
const user = JSON.parse(localStorage.getItem('user'));
console.log('Parsed User:', user);
console.log('User is truthy:', !!user);
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **401/400 error in Network tab** | Wrong credentials OR user doesn't exist | Create new account from Register page and verify it works |
| **200 response but no user data** | Fixed! Restart backend | Clear browser cache & restart backend |
| **Tokens saved but no redirect** | AuthContext not detecting user | Check if localStorage has "user" key with valid JSON |
| **No Network request at all** | Button not submitting form | Check browser console for JavaScript errors |
| **CORS Error** | Backend CORS not configured | Already configured, restart backend |

---

## Manual API Test (Advanced)

If Network tab is confusing, test the backend directly:

### Test with cURL:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Should return:
```json
{
  "access": "token...",
  "refresh": "token...",
  "user": {...}
}
```

### Test Register First:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "password2": "TestPass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

---

## What to Tell Me

When you report the issue, please include:
1. The **Status Code** from the Network tab (200, 400, 401, etc.)
2. The **Response body** from the Network tab
3. Any **Console errors** (red text)
4. Whether localStorage shows tokens and user data
5. What **username** and **password** you used

This will help me identify the exact problem! 🔧
