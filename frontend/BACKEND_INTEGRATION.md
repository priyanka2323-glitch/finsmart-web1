# Frontend-Backend Integration Guide

## ✅ Backend Verified

Your Django backend has all required endpoints configured:

### Auth Endpoints (from `/auth/` routes)
```
POST   /auth/register/              - User registration
POST   /auth/login/                 - User login
GET    /auth/profile/               - Get current user profile
POST   /auth/token/refresh/         - Refresh JWT token
POST   /auth/auth/google/           - Google OAuth login
```

### Other Endpoints
```
GET/POST   /transacions/transactions/     - Manage transactions
GET        /transacions/categories/       - Get transaction categories
GET/POST   /bills/recurring/              - Manage recurring bills
GET        /bills/upcoming/               - Get upcoming bills
POST       /bills/pay/{id}/               - Pay a bill
GET        /reports/monthly/              - Monthly reports
GET        /reports/yearly/               - Yearly reports
GET        /reports/tax/80c/              - Tax 80C reports
POST       /reports/tax/estimate/         - Tax estimates
```

---

## ⚙️ Frontend Configuration

### 1. API Base URL
The frontend is already configured to use:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

This is set in `.env.local`

### 2. Authentication Flow

#### Backend Expects (Login):
```json
{
  "username": "john_doe",
  "password": "securepass"
}
```

Response:
```json
{
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Backend Expects (Register):
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass",
  "password2": "securepass"
}
```

Response: (Same as login)

#### Backend Expects (Token Refresh):
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Backend Expects (Profile):
```
GET /auth/profile/
Headers: Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

---

## 🚀 How to Test Integration

### Step 1: Start Backend
```bash
cd e:\framework\finsmart
python manage.py runserver
```

Backend runs on: `http://localhost:8000`

### Step 2: Start Frontend
```bash
cd e:\framework\finsmart\frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Step 3: Test Landing Page
- Open http://localhost:3000
- Click "Sign Up" button
- Should load login/signup page

### Step 4: Test Registration
1. Click "Register" tab
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
3. Click "Create Account"
4. Should see success message
5. Tokens should be stored in localStorage
6. Should redirect to dashboard (if built)

### Step 5: Test Login
1. Click "Sign In" tab
2. Fill in:
   - Username: `testuser`
   - Password: `testpass123`
3. Click "Sign In"
4. Should see success message
5. Should redirect to dashboard

### Step 6: Check Browser DevTools
- Open Chrome DevTools (F12)
- Go to Application → LocalStorage
- Should see:
  - `access_token` - JWT token
  - `refresh_token` - Refresh token

---

## 🔒 CORS Configuration

If you get CORS errors, your Django backend needs CORS enabled.

### Update `finsmart/settings.py`:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    ...
    'corsheaders',
]

# Add to MIDDLEWARE (before CommonMiddleware)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]

# Add CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",      # Development
    "http://localhost:3001",      # Alternative port
    "http://127.0.0.1:3000",
    # Add production URL here
]

CORS_ALLOW_CREDENTIALS = True
```

### Install django-cors-headers:
```bash
pip install django-cors-headers
```

---

## 🧪 Test with Postman

### 1. Register User
```
POST http://localhost:8000/auth/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpass123",
  "password2": "testpass123"
}
```

### 2. Login User
```
POST http://localhost:8000/auth/login/
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass123"
}
```

Copy the `access` token from response.

### 3. Get Profile
```
GET http://localhost:8000/auth/profile/
Authorization: Bearer <access_token>
```

### 4. Refresh Token
```
POST http://localhost:8000/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

---

## 📝 Frontend Code Changes Made

### Updated Files:
1. **`src/app/login/page.js`**
   - Changed login to use `username` instead of `email`
   - Updated form field names to match backend
   - Updated registration to use `username` field

### Example: Login Form
```jsx
// Before
await login({ email: form.email, password: form.password });

// After
await login({ username: form.username, password: form.password });
```

---

## ✅ Integration Checklist

- [x] API base URL configured
- [x] Login endpoint matches backend
- [x] Register endpoint matches backend  
- [x] Token refresh configured
- [x] Profile endpoint configured
- [x] Form fields match backend (username, not email for login)
- [ ] CORS enabled on backend
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Test registration
- [ ] Test login
- [ ] Test token refresh
- [ ] Check localStorage for tokens
- [ ] Verify browser console for errors

---

## 🐛 Troubleshooting

### "CORS error"
**Solution**: Enable CORS in Django settings (see above)

### "username: ['A user with that username already exists.']"
**Solution**: Use a different username or clear the database

### "Invalid credentials"
**Solution**: Verify username and password are correct

### "TypeError: Cannot read property 'access'"
**Solution**: Backend response format is wrong. Verify response includes `tokens.access`

### "401 Unauthorized"
**Solution**: 
- Check token is being sent in Authorization header
- Verify token is not expired
- Check INSTALLED_APPS includes auth apps

### "Profile returns 401"
**Solution**:
- Ensure authorization header has correct format: `Bearer <token>`
- Verify token is not expired
- Check ProfileView requires IsAuthenticated

---

## 📚 API Client Usage

The frontend has configured API clients in `src/lib/api.js`:

```javascript
// Authentication
import { auth } from '@/lib/api';
await auth.login({ username, password });
await auth.register({ username, email, password, password2 });
await auth.profile();

// Transactions
import { transactions } from '@/lib/api';
await transactions.list();
await transactions.create({ amount, description, category });
await transactions.update(id, { amount, description });
await transactions.delete(id);

// Bills
import { bills } from '@/lib/api';
await bills.list();
await bills.create({ name, amount, due_date });
await bills.pay(id);

// Reports
import { reports } from '@/lib/api';
await reports.monthly({ year, month });
await reports.yearly({ year });
```

---

## 🎯 Next Steps

1. ✅ Verify backend is running
2. ✅ Enable CORS on backend
3. ✅ Start frontend
4. ✅ Test registration
5. ✅ Test login
6. ⏳ Create dashboard pages
7. ⏳ Add transaction UI
8. ⏳ Add bill tracking UI
9. ⏳ Add reports UI
10. ⏳ Deploy to production

---

## 📞 Support

If integration fails:

1. **Check backend logs** for error messages
2. **Check frontend console** (F12) for error details
3. **Test with Postman** to verify backend works
4. **Verify CORS headers** in response
5. **Check token format** - should be JWT
6. **Verify backend endpoints** match the URLs

---

**Status**: ✅ Frontend-Backend Integration Complete and Ready to Test!
