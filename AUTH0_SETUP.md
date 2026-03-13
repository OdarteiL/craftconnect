# Auth0 Integration Guide

## Configuration

The app is now configured to use Auth0 for authentication.

### Setup Environment Variables

#### Frontend (`frontend/.env`)
```env
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_audience
VITE_API_URL=http://localhost:4000/api
```

#### Backend (root `.env`)
```env
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience
```

### Auth0 Dashboard Setup

1. **Configure Allowed Callback URLs**:
   - Go to your Auth0 Application settings
   - Add: `http://localhost:5173, http://localhost:5173/`

2. **Configure Allowed Logout URLs**:
   - Add: `http://localhost:5173, http://localhost:5173/`

3. **Configure Allowed Web Origins**:
   - Add: `http://localhost:5173`

4. **API Configuration**:
   - Ensure your API is configured with the correct audience
   - Enable RBAC if you want role-based permissions

## Changes Made

### Frontend
- Installed `@auth0/auth0-react`
- Replaced custom AuthContext with Auth0Provider
- Updated Navbar to use Auth0 login/logout
- Removed custom login/register pages (Auth0 Universal Login handles this)
- Created new API client that automatically attaches Auth0 tokens

### Backend
- Installed `express-oauth2-jwt-bearer`
- Replaced JWT middleware with Auth0 JWT verification
- Updated auth routes to work with Auth0 tokens
- Modified User model to support `auth0_id` field
- Auto-creates users on first login from Auth0

## Running the App

```bash
# Start the app
docker-compose up --build

# Or manually:
cd frontend && npm run dev
cd backend && npm run dev
```

## How It Works

1. User clicks "Login" or "Sign Up" in the navbar
2. Auth0 Universal Login page opens
3. User authenticates with Auth0
4. Auth0 redirects back with access token
5. Frontend stores token and uses it for API calls
6. Backend verifies token with Auth0
7. Backend creates/fetches user record on first login
8. User can now access protected routes

## User Roles

Users are created with `buyer` role by default. To make a user an artisan:
1. Login to the app
2. Use AdminJS or database to update the user's role to `artisan`

## Testing

1. Visit `http://localhost:5173`
2. Click "Sign Up" to create a new account
3. Complete Auth0 registration
4. You'll be redirected back and logged in
5. Your user profile will be auto-created in the database
