# GreenCart Logistics Application

A comprehensive logistics management system for optimizing delivery operations with a focus on efficiency, driver management, and cost optimization.

## Project Overview

This application helps logistics managers optimize delivery operations by simulating different scenarios based on driver availability, route start times, and maximum working hours. The system calculates key performance indicators (KPIs) such as profit, efficiency score, and delivery timeliness based on proprietary company rules.

## Project Structure

```
├── backend/                # Backend Node.js/Express API
│   ├── controllers/        # Business logic
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose data models
│   ├── routes/             # API routes
│   └── server.js           # Express app entry point
│
├── frontend/               # React frontend application
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React context providers
│       ├── layouts/        # Page layout components
│       ├── pages/          # Page components
│       └── styles/         # CSS styles
```

## Features

- **Authentication System**: Secure login and registration with JWT
- **Dashboard**: Real-time KPIs and performance metrics
- **Simulation Tool**: Optimize delivery operations with customizable parameters
- **Driver Management**: Track driver status, fatigue levels, and work history
- **Route Management**: Configure routes with traffic levels and distance information
- **Order Management**: Track orders from creation to delivery with profit calculation

## Business Rules

- **Late Delivery Penalties**: Orders delivered after the scheduled time incur penalties
- **Driver Fatigue Management**: System tracks driver fatigue levels to ensure safety
- **High-Value Order Bonuses**: Special bonuses for delivering high-value orders
- **Fuel Cost Calculation**: Accurate fuel cost tracking based on route distance
- **Profit Optimization**: Simulation tool to maximize profit by optimizing driver allocation

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication

### Frontend
- React
- React Router
- Context API for state management
- Chart.js for data visualization
- CSS for styling

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create a new driver
- `PUT /api/drivers/:id` - Update a driver
- `DELETE /api/drivers/:id` - Delete a driver
- `PUT /api/drivers/:id/fatigue` - Update driver fatigue status
- `PUT /api/drivers/:id/end-shift` - End driver shift
- `PUT /api/drivers/:id/start-day` - Start new day for driver

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get route by ID
- `POST /api/routes` - Create a new route
- `PUT /api/routes/:id` - Update a route
- `DELETE /api/routes/:id` - Delete a route
- `PUT /api/routes/:id/traffic` - Update traffic level for a route
- `GET /api/routes/:id/fuel-cost` - Calculate fuel cost for a route

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order
- `PUT /api/orders/:id/assign-driver` - Assign driver to an order
- `PUT /api/orders/:id/status` - Update order status

### Simulations
- `POST /api/simulations` - Run a new simulation
- `GET /api/simulations` - Get all simulations
- `GET /api/simulations/:id` - Get simulation by ID
- `POST /api/simulations/:id/apply` - Apply a simulation to real-world operations

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/greencart-logistics.git
   cd greencart-logistics
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     NODE_ENV=development
     MONGODB_URI=mongodb://localhost:27017/greencart
     JWT_SECRET=your_jwt_secret_key
     JWT_EXPIRE=30d
     LOG_LEVEL=info
     ```

4. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

5. Start the development servers
   - Backend:
     ```bash
     cd backend
     npm run dev
     ```
   - Frontend:
     ```bash
     cd frontend
     npm start
     ```

6. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## License

This project is licensed under the MIT License - see the LICENSE file for details.