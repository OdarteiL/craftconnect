# Role-Based Authentication System

## Overview
CraftConnect implements a three-tier role-based authentication system using Auth0 for secure user management.

## User Roles

### 1. **Buyer (Customer)**
Default role for new users who want to purchase products.

**Permissions:**
- Browse and search products
- View product details and reviews
- Add items to cart and checkout
- Participate in auctions (place bids)
- Leave reviews on purchased products
- View order history
- Manage profile

**Access:**
- Homepage, Product Catalog, Product Details
- Auctions (view and bid)
- Cart and Checkout
- Orders page
- Profile page

---

### 2. **Artisan (Seller)**
Users who create and sell handcrafted products.

**Permissions:**
- All Buyer permissions
- Create, edit, and delete own products
- Manage product inventory
- Create and manage auctions
- View sales analytics
- Manage incoming orders
- Upload product images

**Access:**
- All Buyer pages
- Dashboard (seller analytics)
- Product management
- Auction management
- Order fulfillment

**How to become an Artisan:**
- Select "Seller (Artisan)" during signup
- Or update role in profile settings (self-service)

---

### 3. **Admin**
System administrators with full access.

**Permissions:**
- All Artisan permissions
- Create, edit, and delete any user
- Change user roles
- Activate/deactivate user accounts
- View all users
- Moderate content
- Access admin panel
- System configuration

**Access:**
- All pages
- Admin panel (`/admin`)
- User management (`/admin/users`)

**Admin Creation:**
Only existing admins can create new admin accounts through the user management interface.

---

## Authentication Flow

### Signup Process
1. User clicks "Sign up" on login page
2. Selects role: **Buyer** or **Seller (Artisan)**
3. Completes Auth0 signup (Google or Email)
4. User is created in database with selected role
5. Redirected to homepage

### Login Process
1. User clicks "Sign in"
2. Authenticates via Auth0
3. Backend fetches/creates user profile
4. User redirected based on role

---

## API Endpoints

### Public Endpoints
- `POST /api/auth/login` - Login (handled by Auth0)
- `POST /api/auth/register` - Register (handled by Auth0)

### Authenticated Endpoints
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update own profile
- `PUT /api/auth/role` - Update own role (buyer ↔ artisan only)

### Admin-Only Endpoints
- `GET /api/auth/users` - List all users
- `POST /api/auth/users` - Create new user
- `DELETE /api/auth/users/:id` - Delete user
- `PUT /api/auth/users/:id/role` - Change user role
- `PUT /api/auth/users/:id/status` - Activate/deactivate user

---

## Frontend Role Checks

### Using AuthContext
```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAdmin, isArtisan, isBuyer } = useAuth();

  if (isAdmin) {
    // Show admin features
  }

  if (isArtisan || isAdmin) {
    // Show seller features
  }

  if (isBuyer) {
    // Show buyer features
  }
}
```

### Protected Routes
```jsx
// Redirect non-admins
useEffect(() => {
  if (!isAdmin) {
    navigate('/');
  }
}, [isAdmin]);
```

---

## Auction Access

Both **Buyers** and **Artisans** can access auctions:

- **Buyers**: Can view and bid on auctions
- **Artisans**: Can view, bid, and create auctions for their products
- **Admins**: Full auction management

---

## Security Features

1. **JWT Authentication**: Secure token-based auth via Auth0
2. **Role Validation**: Backend validates roles on every request
3. **Self-Service Limits**: Users can only upgrade buyer ↔ artisan
4. **Admin Protection**: Only admins can create admin accounts
5. **Account Safety**: Users cannot delete their own account
6. **Active Status**: Admins can deactivate accounts without deletion

---

## Database Schema

```sql
users table:
- id (UUID)
- email (unique)
- auth0_id (unique)
- first_name
- last_name
- role (buyer | artisan | admin)
- phone
- avatar_url
- bio
- location
- is_verified
- is_active
- created_at
- updated_at
```

---

## Initial Admin Setup

To create the first admin user:

1. Sign up normally as a buyer
2. Manually update the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Log out and log back in
4. Access admin panel at `/admin/users`
5. Create additional admin accounts through the UI

---

## Role Upgrade Path

```
Buyer → Artisan (self-service via profile)
Buyer → Admin (admin-only)
Artisan → Admin (admin-only)
Admin → Buyer/Artisan (admin-only, not recommended)
```

---

## Best Practices

1. **Default to Buyer**: New users should start as buyers
2. **Verify Artisans**: Consider manual verification for sellers
3. **Limit Admins**: Keep admin accounts to minimum necessary
4. **Audit Logs**: Track role changes and admin actions
5. **Regular Reviews**: Periodically review user roles and access

---

## Troubleshooting

**User can't access admin panel:**
- Verify role is 'admin' in database
- Check Auth0 token includes correct role
- Ensure user is logged in

**Role not updating:**
- Clear browser cache
- Log out and log back in
- Check backend logs for errors

**Auction access denied:**
- Verify user is authenticated
- Check role is 'buyer', 'artisan', or 'admin'
- Ensure account is active

---

## Future Enhancements

- Email verification for artisans
- Artisan application/approval process
- Role-based pricing tiers
- Advanced permissions (e.g., moderator role)
- Activity logging and audit trails
