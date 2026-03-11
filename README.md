# CraftConnect 🏺

A full-stack e-commerce platform connecting indigenous artisans from Aburi, Ghana with buyers worldwide. Features a marketplace for handcrafted products and live auction functionality.

## 🌟 Features

- **Marketplace**: Browse and purchase authentic handcrafted products
- **Live Auctions**: Bid on unique one-of-a-kind pieces
- **Artisan Dashboard**: Manage products, auctions, and orders
- **Shopping Cart**: Seamless checkout experience
- **Reviews & Ratings**: Community feedback system
- **Category Browsing**: Filter by craft type (Beads, Textiles, Wood Carvings, etc.)
- **Responsive Design**: Mobile-first approach with beautiful UI

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- Custom CSS with Kente-inspired design system

### Backend
- **Node.js** with Express
- **PostgreSQL** database with Sequelize ORM
- **Redis** for caching
- **JWT** authentication
- **AdminJS** for admin panel
- **Helmet** for security
- **Rate limiting** for API protection

### DevOps
- **Docker** & Docker Compose
- Multi-container setup (Frontend, Backend, Database, Redis)

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/craftconnect.git
cd craftconnect
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=craftconnect
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=craftconnect_db
DATABASE_URL=postgresql://craftconnect:your_secure_password@db:5432/craftconnect_db

# Redis
REDIS_URL=redis://redis:6379

# Backend
PORT=4000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173

# Admin
ADMIN_EMAIL=admin@craftconnect.com
ADMIN_PASSWORD=admin123
```

### 3. Start with Docker

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **Admin Panel**: http://localhost:4000/admin

### 4. Manual Setup (Alternative)

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
craftconnect/
├── backend/
│   ├── src/
│   │   ├── admin/          # AdminJS configuration
│   │   ├── config/         # Database & Redis config
│   │   ├── middleware/     # Auth & validation
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context
│   │   ├── pages/          # Page components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Global styles
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── init/
│   │   └── 01-schema.sql   # Database schema
│   └── Dockerfile
├── caching/
│   └── redis.conf
├── docker-compose.yml
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (artisan only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Auctions
- `GET /api/auctions` - List auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create auction (artisan only)
- `POST /api/auctions/:id/bid` - Place bid

### Cart & Orders
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/products/:id/reviews` - Get product reviews

## 👥 User Roles

### Buyer
- Browse and purchase products
- Participate in auctions
- Leave reviews
- Manage orders

### Artisan
- All buyer features
- Create and manage products
- Create and manage auctions
- View sales analytics
- Manage inventory

### Admin
- Full system access
- User management
- Content moderation
- System configuration

## 🎨 Design System

The UI is inspired by Ghanaian Kente cloth with a rich color palette:

- **Gold** (#D4A017) - Primary accent
- **Green** (#1B5E20) - Secondary
- **Terracotta** (#CC5500) - Highlights
- **Earth tones** - Supporting colors
- **Dark mode** - Primary theme

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js security headers
- CORS configuration
- SQL injection protection (Sequelize)
- XSS protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Touch-friendly interface
- Optimized images

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Update `.env` with production values:
- Use strong passwords
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use production database URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Inspired by the rich craft heritage of Aburi, Ghana
- Built to empower local artisans
- Design inspired by traditional Kente cloth patterns

## 📧 Contact

For questions or support, please contact: your.email@example.com

## 🐛 Bug Reports

Found a bug? Please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

---

**Made with ❤️ in Ghana**
