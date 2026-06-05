Backend

Groceria Backend is the server-side application of the Groceria Grocery E-Commerce Platform. It provides REST APIs for authentication, product management, cart operations, wishlist management, order processing, and administrative functionalities.

Project Overview

-> Built using Node.js and Express.js

-> Uses MongoDB Atlas as the cloud database

-> Implements JWT based authentication

-> Provides secure APIs for frontend communication

-> Follows MVC architecture for better scalability

Tech Stack

-> Node.js

-> Express.js

-> MongoDB Atlas

-> Mongoose

-> JWT

-> bcryptjs

-> Nodemailer

-> dotenv

-> Express Validator

-> Helmet

-> CORS

-> Express Rate Limit

-> Mongo Sanitize

-> HPP

Features

-> User Registration

-> User Login

-> JWT Authentication

-> Forgot Password

-> Reset Password

-> User Profile Management

-> Product CRUD Operations

-> Cart Management

-> Wishlist Management

-> Order Placement

-> Order History

-> Order Cancellation

-> Contact Form Support

-> Email Notifications

-> Admin User Management

-> Admin Product Management

-> Admin Order Management

Application Flow

-> Frontend sends requests to API endpoints

-> Express routes handle incoming requests

-> Controllers process business logic

-> Middleware validates and secures requests

-> MongoDB stores application data

-> JSON responses are returned to frontend

Project Structure

backend/

-> Controllers/

-> Models/

-> Middleware/

-> Routers/

-> Utils/

-> server.js

-> package.json

-> .env

Installation

Clone Repository

```bash
git clone https://github.com/yourusername/groceria-backend.git
cd groceria-backend
```

Install Dependencies

```bash
npm install
```

Run Server

```bash
node server.js
```

Environment Variables

```env
MONGO_URL=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
```

Database Connection Example

```javascript
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("Database Connected"))
.catch((err) => console.log(err));
```

API Base URL

```text
http://localhost:5000/api
```

Authentication APIs

```http
POST /api/user/register
POST /api/user/login
POST /api/user/forgot-password
POST /api/user/reset-password/:token
PUT  /api/user/profile
```

Product APIs

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Cart APIs

```http
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/:productId
DELETE /api/cart/clear
```

Wishlist APIs

```http
GET    /api/wishlist
POST   /api/wishlist/add
DELETE /api/wishlist/remove/:productId
DELETE /api/wishlist/clear
```

Order APIs

```http
POST /api/orders
GET  /api/orders/my
GET  /api/orders/:id
PUT  /api/orders/:id/cancel
```

Security Features

-> JWT Authentication

-> Password Hashing

-> Role Based Authorization

-> Rate Limiting

-> XSS Protection

-> NoSQL Injection Protection

-> Helmet Security Headers

-> Secure Environment Variables

Database Collections

-> Users

-> Products

-> Orders

-> Cart

-> Wishlist

Deployment

-> Backend deployed using Render

-> MongoDB Atlas used as cloud database

-> Environment variables configured securely

Future Improvements

-> Payment Gateway Integration

-> Product Reviews

-> Product Ratings

-> Inventory Management

-> Real-Time Order Tracking

-> Analytics Dashboard

Author

Aravind M

Full Stack Grocery E-Commerce Project

Sri Eshwar College of Engineering
