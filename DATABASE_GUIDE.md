# Database Guide

## Credentials

| Field    | Value                    |
|----------|--------------------------|
| Host     | `localhost`              |
| Port     | `5432`                   |
| User     | `craftconnect`           |
| Password | `change-me-in-production`|
| Database | `craftconnect`           |

---

## Connect via Terminal

```bash
docker exec -it craftconnect-db psql -U craftconnect -d craftconnect
```

---

## Essential psql Commands

```sql
-- List all tables
\dt

-- Describe a table's structure
\d users
\d products
\d auctions
\d bids
\d orders

-- Exit
\q
```

---

## Common Queries

### Users
```sql
-- View all users
SELECT id, first_name, last_name, email, role, is_verified FROM users;

-- View only artisans
SELECT id, first_name, last_name, email FROM users WHERE role = 'artisan';

-- Reset a user's password hash
UPDATE users SET password_hash = '<hash>' WHERE email = 'user@example.com';
```

### Generate a bcrypt password hash
```bash
docker exec -it craftconnect-api node -e \
  "require('bcryptjs').hash('NewPassword1!', 10).then(h => console.log(h))"
```

### Products
```sql
SELECT id, name, price, stock, status FROM products;
```

### Orders
```sql
SELECT id, buyer_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC;
```

### Auctions & Bids
```sql
-- All auctions
SELECT id, product_id, starting_price, current_price, bid_count, status, end_time FROM auctions;

-- Bids for a specific auction
SELECT b.amount, u.first_name, u.last_name, u.email, b.created_at
FROM bids b
JOIN users u ON u.id = b.bidder_id
WHERE b.auction_id = '<auction-uuid>'
ORDER BY b.amount DESC;
```

---

## GUI Access (Optional)

Connect any Postgres client (TablePlus, DBeaver, pgAdmin) with:

- **Host:** `localhost`
- **Port:** `5432`
- **User:** `craftconnect`
- **Password:** `change-me-in-production`
- **Database:** `craftconnect`
