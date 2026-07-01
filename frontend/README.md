# FinSmart Frontend

A modern Next.js frontend for personal finance management with landing page, authentication, and dashboard.

## Features

- **Landing Page**: Beautiful hero section with feature highlights, CTA buttons, stats
- **Authentication**: Sign up and sign in pages with form validation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Component Library**: Reusable components (Button, Input, Card, Navbar, Footer)
- **API Integration**: Ready to connect with Django backend
- **Auth Context**: Global state management for authentication
- **Form Validation**: Client-side validation for signup and login

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Context API
- **UI Components**: Lucide React Icons
- **HTTP Client**: Fetch API with custom wrapper

## Project Structure

```
src/
├── app/
│   ├── layout.js              # Root layout with navbar & footer
│   ├── page.js                # Landing page
│   ├── globals.css            # Global styles
│   ├── layout.css             # Layout styles
│   └── login/
│       ├── page.js            # Login/Signup combined page
│       └── login.module.css   # Login styles
├── components/
│   ├── Button.jsx             # Reusable button component
│   ├── Input.jsx              # Reusable input component
│   ├── Card.jsx               # Reusable card component
│   ├── Navbar.jsx             # Navigation bar (client-side)
│   ├── Footer.jsx             # Footer component
│   └── index.js               # Barrel export
├── lib/
│   ├── AuthContext.js         # Auth state management
│   ├── api.js                 # API client & endpoints
│   ├── validation.js          # Form validation utilities
│   └── utils.js               # Utility functions
└── public/                    # Static assets
```

## Setup & Installation

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
cd frontend
npm install --legacy-peer-deps
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

The app will run at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Authentication Flow

1. **Login Page**: User enters email and password
   - Form validation on submit
   - API call to `/auth/login/`
   - Tokens stored in localStorage
   - Redirect to `/dashboard` on success

2. **Signup Page**: User creates account
   - Form validation (name, email, password, password confirmation)
   - API call to `/auth/register/`
   - Tokens stored in localStorage
   - Auto-redirect to dashboard

3. **Token Refresh**: Automatic token refresh when expired
   - Interceptor checks 401 responses
   - Calls `/auth/token/refresh/`
   - Retries original request with new token

4. **Logout**: Clear tokens and redirect to login

## API Endpoints

Backend should implement these endpoints:

### Authentication
- `POST /auth/login/` - Login with email/password
- `POST /auth/register/` - Register new user
- `POST /auth/token/refresh/` - Refresh access token
- `GET /auth/profile/` - Get current user profile

### Expected Response Formats

**Login & Register Response:**
```json
{
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Key Components

### AuthContext
Provides authentication state and methods to all components:
- `user` - Current user object or null
- `loading` - Loading state
- `error` - Error message if any
- `login(credentials)` - Login function
- `register(credentials)` - Register function
- `logout()` - Logout function
- `isAuthenticated` - Boolean flag

### API Client
Configured in `lib/api.js`:
- Automatic token injection
- Token refresh on 401
- Field-level error handling
- JSON request/response

### Validation
Form validation utilities in `lib/validation.js`:
- Email validation
- Password strength check
- Password match validation
- Full form validation

## Styling

### Tailwind CSS
- Custom colors (primary, secondary, danger, warning)
- Responsive utilities
- Component layer classes (btn-primary, input-field, card)

### CSS Modules
- Login page: `login.module.css`
- Scoped styles preventing conflicts
- Mobile-responsive design

## Pages

### Landing Page (`/`)
- Hero section with CTA
- Features showcase (4 feature cards)
- Call-to-action section
- Statistics section
- Fully responsive

### Login Page (`/login`)
- Tab toggle between Sign In and Register
- Email/password fields
- Remember me checkbox
- Password visibility toggle
- Form validation with error display
- Link to signup (register tab)

### Protected Routes
- `/dashboard` - Main app (requires authentication)
- Auto-redirect to `/login` if not authenticated

## Error Handling

- Form validation errors displayed inline
- API errors shown in error messages
- 401 Unauthorized triggers auto logout
- Network errors handled gracefully

## Best Practices Implemented

✅ Client-side form validation
✅ Secure token storage and refresh
✅ Global state management (Context API)
✅ Component composition and reusability
✅ Responsive mobile-first design
✅ Error handling and user feedback
✅ SEO-friendly metadata
✅ Accessible form inputs
✅ Loading states for async operations
✅ Clean code structure and organization

## Future Enhancements

- [ ] Create dedicated `/signup` page route
- [ ] Add forgot password flow
- [ ] Implement social login (Google OAuth)
- [ ] Add email verification
- [ ] Dashboard pages with charts
- [ ] Transaction management UI
- [ ] Bill tracking UI
- [ ] Tax report generation UI
- [ ] Dark mode support
- [ ] Mobile app (React Native)

## Troubleshooting

### Build Errors
- Ensure Node version is 16+
- Run `npm install --legacy-peer-deps`
- Clear `.next` folder: `rm -rf .next`

### API Connection Issues
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in Django
- Verify endpoint paths match backend routes

### Auth Issues
- Clear browser localStorage
- Check token validity
- Verify refresh token endpoint

## License

MIT
