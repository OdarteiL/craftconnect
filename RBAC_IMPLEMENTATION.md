# Role-Based Access Control Implementation

## Overview
Implemented a three-tier user role system for CraftConnect:
1. **Admin** - Full system privileges
2. **Artisan (Seller)** - Can create/manage products and auctions
3. **Buyer (Customer)** - Can browse, purchase, and bid on auctions

## Backend Changes

### 1. Authentication Middleware (`backend/src/middleware/auth.js`)
- Added `requireRole(...roles)` middleware function
- Checks if authenticated user has one of the specified roles
- Returns 403 Forbidden if user lacks permissions

### 2. Auth Routes (`backend/src/routes/auth.js`)
Added new endpoints:

**User Self-Service:**
- `PUT /api/auth/role` - Users can switch between 'buyer' and 'artisan' roles

**Admin Only:**
- `GET /api/auth/users` - List all users
- `DELETE /api/auth/users/:id` - Delete a user
- `PUT /api/auth/users/:id/role` - Change any user's role (including to 'admin')

### 3. Protected Routes
Updated routes to use role-based protection:

**Products (`backend/src/routes/products.js`):**
- `POST /api/products` - Requires 'artisan' or 'admin'
- `PUT /api/products/:id` - Requires 'artisan' or 'admin' (owner check)
- `DELETE /api/products/:id` - Requires 'artisan' or 'admin' (owner check)

**Auctions (`backend/src/routes/auctions.js`):**
- `POST /api/auctions` - Requires 'artisan' or 'admin'
- `POST /api/auctions/:id/bid` - Any authenticated user (buyers and artisans)

## Frontend Changes

### 1. AuthContext (`frontend/src/context/AuthContext.jsx`)
- Enhanced to fetch user profile from backend
- Added `refreshUser()` function to reload user data after updates
- Provides user object with role information

### 2. Profile Page (`frontend/src/pages/ProfilePage.jsx`)
New page where users can:
- View and update personal information
- Switch between 'buyer' and 'artisan' roles
- Edit bio (for artisans)

### 3. Admin Dashboard (`frontend/src/pages/AdminPage.jsx`)
New admin-only page to:
- View all users
- Change user roles (buyer, artisan, admin)
- Delete users

### 4. Routes (`frontend/src/App.jsx`)
Added:
- `/profile` - Profile management page
- `/admin` - Admin dashboard

## User Flows

### New User Registration
1. User signs up via Auth0
2. Backend auto-creates user with 'buyer' role
3. User can navigate to `/profile` to switch to 'artisan' if they want to sell

### Artisan Creating Products
1. User must have 'artisan' or 'admin' role
2. Navigate to dashboard
3. Create products and auctions
4. Only artisans can see their own products in dashboard

### Admin Management
1. Admin logs in
2. Navigates to `/admin`
3. Can view all users, change roles, or delete users
4. Can promote users to admin status

### Auction Access
- **Artisans**: Can create auctions for their products
- **Buyers & Artisans**: Can bid on any auction (except their own)
- Artisans cannot bid on their own auctions

## Security Features

1. **JWT Authentication**: All protected routes require valid Auth0 token
2. **Role Verification**: Middleware checks user role before allowing access
3. **Ownership Checks**: Artisans can only edit/delete their own products
4. **Admin Override**: Admins can manage any resource
5. **Self-Service Limits**: Users can only switch between 'buyer' and 'artisan' (not to 'admin')

## Database Schema
The existing User model already has a `role` field:
```javascript
role: {
  type: DataTypes.STRING(50),
  defaultValue: 'buyer'
}
```

Valid roles: 'buyer', 'artisan', 'admin'

## Testing the Implementation

### Test as Buyer:
1. Sign up/login
2. Browse products and auctions
3. Add to cart and checkout
4. Place bids on auctions

### Test as Artisan:
1. Go to `/profile` and switch role to 'artisan'
2. Navigate to `/dashboard`
3. Create products
4. Create auctions
5. Can still buy and bid like a buyer

### Test as Admin:
1. Manually set a user's role to 'admin' in database OR
2. Use another admin account to promote via `/admin`
3. Access `/admin` dashboard
4. Manage all users and roles

## Next Steps (Optional Enhancements)

1. **Email Verification**: Require email verification before allowing artisan role
2. **Artisan Approval**: Admin approval required before artisan can sell
3. **Permissions System**: More granular permissions beyond roles
4. **Activity Logs**: Track admin actions for audit trail
5. **Role-Based UI**: Show/hide navigation items based on user role
6. **Seller Verification**: Badge system for verified artisans
