# Frontend-Backend Integration Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│                    http://localhost:3000                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                           │
│                    (Port 3000)                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pages                                                     │  │
│  │ • Landing Page (/)                                       │  │
│  │ • Login/Signup Page (/login)                            │  │
│  │ • Dashboard (future)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Components                                                │  │
│  │ • Navbar, Footer, Forms                                 │  │
│  │ • Buttons, Inputs, Cards                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ State Management                                          │  │
│  │ • AuthContext (user, loading, error)                    │  │
│  │ • JWT Token Management                                  │  │
│  │ • Form State                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Client (lib/api.js)                                 │  │
│  │ • Automatic token injection                             │  │
│  │ • Token refresh on 401                                  │  │
│  │ • Error handling                                        │  │
│  │ • baseURL: http://localhost:8000                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JSON + JWT Tokens
                              │ Authorization: Bearer <token>
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DJANGO BACKEND                               │
│                    (Port 8000)                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ URL Routes (finsmart/urls.py)                           │  │
│  │ • /auth/ → accounts.urls                                │  │
│  │ • /transacions/ → transaction.urls                      │  │
│  │ • /bills/ → bills.urls                                  │  │
│  │ • /reports/ → reports.urls                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Accounts App (Authentication)                           │  │
│  │ • RegisterView - POST /auth/register/                   │  │
│  │ • LoginView - POST /auth/login/                         │  │
│  │ • ProfileView - GET /auth/profile/                      │  │
│  │ • TokenRefreshView - POST /auth/token/refresh/          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Transaction App                                          │  │
│  │ • TransactionViewSet - CRUD transactions                │  │
│  │ • CategoryViewSet - List categories                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Bills App                                                │  │
│  │ • BillViewSet - CRUD recurring bills                    │  │
│  │ • UpcomingBillsView - List upcoming bills               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Reports App                                              │  │
│  │ • Monthly/Yearly reports                                │  │
│  │ • Tax calculations (80C)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Security & Settings                                     │  │
│  │ • JWT Authentication (SimpleJWT)                        │  │
│  │ • CORS enabled (corsheaders)                            │  │
│  │ • Token lifetime: 1 day                                 │  │
│  │ • Refresh lifetime: 7 days                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Database (SQLite)                                        │  │
│  │ • Users                                                 │  │
│  │ • Transactions                                          │  │
│  │ • Bills                                                 │  │
│  │ • Reports                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER INTERACTION                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    1. Fill signup form
                    2. Click "Create Account"
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ Frontend: Form Validation            │
        │ • Username: required, 3+ chars      │
        │ • Email: valid format               │
        │ • Password: 8+ chars                │
        │ • Password match                    │
        └──────────────────────────────────────┘
                              │
                   3. Send valid form data
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ POST /auth/register/                 │
        │ {                                    │
        │   "username": "john_doe",            │
        │   "email": "john@example.com",       │
        │   "password": "SecurePass123",       │
        │   "password2": "SecurePass123"       │
        │ }                                    │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ Backend: Register View               │
        │ • Create user                        │
        │ • Hash password                      │
        │ • Generate JWT tokens                │
        └──────────────────────────────────────┘
                              │
                   4. Return tokens
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ Response 201 Created:                │
        │ {                                    │
        │   "tokens": {                        │
        │     "access": "eyJ0eXAi...",         │
        │     "refresh": "eyJ0eXAi..."         │
        │   },                                 │
        │   "user": {                          │
        │     "id": 1,                         │
        │     "username": "john_doe",          │
        │     "email": "john@example.com"      │
        │   }                                  │
        │ }                                    │
        └──────────────────────────────────────┘
                              │
                   5. Store tokens
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ Frontend: AuthContext                │
        │ • localStorage.access_token =        │
        │   eyJ0eXAi...                        │
        │ • localStorage.refresh_token =       │
        │   eyJ0eXAi...                        │
        │ • setUser(data.user)                 │
        │ • Set isAuthenticated = true         │
        └──────────────────────────────────────┘
                              │
                   6. Redirect to dashboard
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │ Dashboard (or 404 if not built)      │
        └──────────────────────────────────────┘
```

---

## API Request with Token

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATED REQUEST                         │
└─────────────────────────────────────────────────────────────────┘

Frontend Makes Request:
┌──────────────────────────────────┐
│ GET /auth/profile/               │
│                                  │
│ Headers:                         │
│ • Content-Type: application/json │
│ • Authorization: Bearer eyJ0eXA  │
│   ...                            │
└──────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│ Backend JWT Middleware           │
│ • Verify token signature         │
│ • Check token not expired        │
│ • Extract user info              │
│ • Set request.user               │
└──────────────────────────────────┘
            │
            ▼
        ┌───────┐
        │Valid? │
        └───┬───┘
           /│\
          / │ \
         /  │  \
       YES │  NO
         /   \
        ▼     ▼
    [Allow]  [401]
    Process  Return
    Request  Error
```

---

## Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   TOKEN EXPIRATION HANDLING                     │
└─────────────────────────────────────────────────────────────────┘

1. Frontend makes request with access token
2. Backend returns 401 Unauthorized
3. Frontend intercepts 401

┌──────────────────────────────────┐
│ API Client Refresh Logic         │
│ • Check if 401                   │
│ • Is it auth endpoint? (no)      │
│ • Try to refresh token           │
└──────────────────────────────────┘
            │
            ▼
4. Send refresh token to backend
┌──────────────────────────────────┐
│ POST /auth/token/refresh/        │
│ {                                │
│   "refresh": "eyJ0eXA..."        │
│ }                                │
└──────────────────────────────────┘
            │
            ▼
5. Backend verifies and issues new access token
┌──────────────────────────────────┐
│ Response 200 OK:                 │
│ {                                │
│   "access": "eyJ0eXAi_NEW..."    │
│ }                                │
└──────────────────────────────────┘
            │
            ▼
6. Frontend stores new token
┌──────────────────────────────────┐
│ localStorage.access_token =      │
│   eyJ0eXAi_NEW...                │
└──────────────────────────────────┘
            │
            ▼
7. Retry original request with new token
┌──────────────────────────────────┐
│ GET /auth/profile/               │
│ Authorization: Bearer eyJ0eXAi   │
│   _NEW...                        │
└──────────────────────────────────┘
            │
            ▼
8. Request succeeds ✅
```

---

## Data Flow

```
User Input
    │
    ▼
React Component
    │
    ├──► Form Validation
    │    (lib/validation.js)
    │
    ├──► Update State
    │    (AuthContext)
    │
    └──► API Call
         (lib/api.js)
            │
            ├──► Add Token Header
            │
            ├──► Make Request
            │    (fetch API)
            │
            ├──► Handle Response
            │    • Success: Update state
            │    • 401: Refresh token
            │    • Error: Show message
            │
            └──► Update UI
                 • Show data
                 • Clear loading
                 • Show errors
```

---

## Storage

```
┌──────────────────────────────────────────────────┐
│           LOCAL STORAGE (Browser)                │
├──────────────────────────────────────────────────┤
│                                                  │
│ access_token: eyJ0eXAiOiJKV1QiLCJhbGc...       │
│ (JWT token - expires in 1 day)                  │
│                                                  │
│ refresh_token: eyJ0eXAiOiJKV1QiLCJhbGc...      │
│ (JWT token - expires in 7 days)                 │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│          MEMORY (React State)                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ user: {                                         │
│   id: 1,                                        │
│   username: "john_doe",                         │
│   email: "john@example.com"                     │
│ }                                               │
│                                                  │
│ loading: false                                  │
│ isAuthenticated: true                           │
│ error: null                                     │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│        BACKEND DATABASE (SQLite)                 │
├──────────────────────────────────────────────────┤
│                                                  │
│ Users Table:                                    │
│ • id, username, email, password_hash           │
│                                                  │
│ Transactions Table:                             │
│ • id, user, amount, category, date             │
│                                                  │
│ Bills Table:                                    │
│ • id, user, name, amount, due_date             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
Production:
┌─────────────────────────────────────────────────┐
│  User Browser (HTTPS)                           │
└────────────────────┬────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼                           ▼
┌──────────────────┐    ┌──────────────────┐
│  Vercel/Netlify  │    │  AWS/Heroku      │
│  (Next.js)       │    │  (Django)        │
│  frontend        │    │  backend         │
│  (optimized)     │    │  (optimized)     │
└──────────────────┘    └──────────────────┘
       │                           │
       └─────────────┬─────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  PostgreSQL DB   │
            │  (production)    │
            └──────────────────┘
```

---

## Error Handling Flow

```
                    API Request
                         │
                         ▼
                    Response Status
                         │
          ┌──────────┬────┴────┬──────────┐
          │          │         │          │
          ▼          ▼         ▼          ▼
        2xx        400/422    401       5xx
        │          │          │         │
        OK     Validation    Expired   Server
              Error         Token     Error
        │          │          │         │
        ▼          ▼          ▼         ▼
    Update    Show Field  Refresh   Show Error
    Data      Error Msg   Token     Message
                           │
                      Retry Request
```

---

## Summary

✅ **Frontend** communicates with **Backend** via REST API
✅ **JWT tokens** handle authentication
✅ **CORS** allows cross-origin requests
✅ **Automatic token refresh** keeps users logged in
✅ **Error handling** on both sides
✅ **Secure storage** of sensitive data

**Status**: 🚀 Ready to Launch!
