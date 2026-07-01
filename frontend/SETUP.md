# FinSmart Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is needed because some packages have peer dependency conflicts with the current versions. This is safe for development.

### 2. Environment Setup
```bash
# Copy the environment template
cp .env.example .env.local
```

Edit `.env.local` to match your setup:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Backend Setup
Ensure your Django backend is running:
```bash
cd .. # Go to project root
python manage.py runserver
```

The backend should be accessible at `http://localhost:8000`

### 4. Run Frontend
```bash
npm run dev
```

Visit `http://localhost:3000`

## Architecture

### Authentication Flow
```
User → Login Page → API Call → Backend Auth → Tokens Stored → Dashboard
                       ↓
                   Validation
                   (Client-side)
```

### File Organization
- **Pages**: `src/app/` - All routes and pages
- **Components**: `src/components/` - Reusable UI components
- **Business Logic**: `src/lib/` - Auth context, API client, validation
- **Styles**: `*.css` and `*.module.css` - Global and scoped styles

### Key Files
- `src/app/page.js` - Landing page (public)
- `src/app/login/page.js` - Auth page (login + signup)
- `src/lib/AuthContext.js` - Authentication state
- `src/lib/api.js` - API client with token handling
- `src/lib/validation.js` - Form validators
- `src/components/Navbar.jsx` - Navigation (client-side)
- `src/components/Footer.jsx` - Footer

## Development Tips

### Adding New Pages
1. Create directory: `src/app/new-page/`
2. Create `page.js` inside
3. Export default component

### Adding New Components
1. Create `ComponentName.jsx` in `src/components/`
2. Add to `src/components/index.js` for barrel export
3. Import and use in pages

### Using Authentication
```jsx
'use client';
import { useAuth } from '@/lib/AuthContext';

export default function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Hello, {user.name}!</div>;
}
```

### Form Validation
```jsx
import { validateLoginForm } from '@/lib/validation';

const { valid, errors } = validateLoginForm(email, password);
if (!valid) {
  console.log('Errors:', errors);
}
```

### API Calls
```jsx
import { transactions } from '@/lib/api';

// List transactions
const txns = await transactions.list({ month: '2024-01' });

// Create transaction
const newTxn = await transactions.create({
  amount: 100,
  description: 'Groceries',
  category: 'food'
});

// Update transaction
await transactions.update(id, { amount: 120 });

// Delete transaction
await transactions.delete(id);
```

## Backend Integration Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] CORS enabled for `http://localhost:3000`
- [ ] Auth endpoints implemented:
  - [ ] `POST /auth/login/`
  - [ ] `POST /auth/register/`
  - [ ] `POST /auth/token/refresh/`
  - [ ] `GET /auth/profile/`
- [ ] API endpoints respond with correct format
- [ ] Tokens follow JWT format
- [ ] Bearer token auth working

### Expected Backend Response

**Login/Register:**
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

**Profile:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### API connection fails
1. Check backend is running: `http://localhost:8000`
2. Verify CORS headers in Django settings
3. Check `.env.local` has correct API URL
4. Check network tab in browser dev tools

### Login not working
1. Verify backend auth endpoints
2. Check token storage in localStorage (browser DevTools)
3. Test API with Postman/Insomnia
4. Check backend error logs

### Build errors
```bash
# Clear cache and rebuild
npm run build -- --reset-cache
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Self-hosted
```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_API_BASE_URL` to your production backend URL.

## Testing

Currently no automated tests are set up. To add:

1. Install testing libraries:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

2. Create test files (e.g., `Button.test.jsx`)

3. Run tests:
```bash
npm test
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

## Performance Tips

- Use code splitting with dynamic imports
- Optimize images with `next/image`
- Implement lazy loading for routes
- Cache API responses where appropriate
- Monitor with Vercel Analytics

## Security

- Never commit `.env.local`
- Keep dependencies updated
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data before display
- Use HTTPS in production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Context API](https://react.dev/reference/react/useContext)
- [JWT Authentication](https://jwt.io)

## Support

For issues or questions:
1. Check this guide
2. Review error messages in browser console
3. Check backend logs
4. Open an issue on GitHub
