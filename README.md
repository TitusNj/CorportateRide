# Corporate Ride-Booking Application

A full-stack web application for corporate ride booking and management, similar to Safaricom's internal ride booking system.

## Features

- User authentication with role-based access (admin, employee, driver)
- Ride booking and management
- Vehicle and driver assignment
- Billing and invoicing
- Dashboard with analytics
- Responsive design

## Tech Stack

### Backend
- Flask (Python)
- SQLAlchemy ORM
- JWT Authentication
- RESTful API
- SQLite database (can be replaced with PostgreSQL for production)

### Frontend
- React
- React Router for navigation
- Context API for state management
- Tailwind CSS for styling
- Axios for API requests



## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   \`\`\`
   cd backend
   \`\`\`

2. Create a virtual environment:
   \`\`\`
   python -m venv venv
   \`\`\`

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

5. Run the Flask application:
   \`\`\`
 ### Corporate Ride-Booking Web Application

I'll create a full-stack corporate ride-booking application with a Flask backend and React frontend. This application will allow companies to book and manage employee transportation with vetted drivers and company-approved vehicles.

## Project Structure

We'll build this as two separate applications:

1. Backend: Flask API server named "corporate-rides-api"
2. Frontend: React client named "corporate-rides-client"


Let's start by implementing both parts:

## Backend Implementation (Flask + SQLAlchemy)

First, let's set up the Flask backend with all required models and endpoints:

```typescriptreact project="corporate_rides"
...
```

## Project Overview

I've created a full-stack corporate ride-booking application with a Flask backend and React frontend. This application allows companies to book and manage employee transportation with vetted drivers and company-approved vehicles.

### Backend (Flask + SQLAlchemy)

The backend is a Flask API server named "corporate-rides-api" with the following features:

1. **Models**:

1. User (employee, admin, driver)
2. Ride (with full CRUD operations)
3. Vehicle
4. Billing
5. Company
6. Many-to-many relationship between Driver and Vehicle



2. **API Endpoints**:

1. Authentication (login, register)
2. Rides management
3. Vehicles management
4. Billing management
5. Companies management
6. Drivers management



3. **Features**:

1. RESTful API design
2. JWT authentication
3. Role-based access control
4. Error handling
5. Data validation
6. Seed data for testing





### Frontend (React)

The frontend is a React application named "corporate-rides-client" with the following features:

1. **Routes**:

1. /login - Authentication
2. /dashboard - Overview
3. /rides - List of rides
4. /rides/new - Create new ride
5. /rides/:id - Edit ride
6. /vehicles - Vehicle management
7. /billing - Invoice management



2. **Features**:

1. Role-based UI with useContext
2. Full CRUD operations for rides
3. Vehicle management with driver assignments
4. Billing management
5. Dashboard with statistics and filters
6. Responsive design with Material UI





## How to Run the Application

### Backend Setup

1. Navigate to the backend directory:

cd server

2. Create a virtual environment:

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

3. Install dependencies:

pip install -r requirements.txt

4. Seed the database:

python seed.py

5. Run the application:


python run.py


The Flask API will be available at [http://localhost:5000/api](http://localhost:5000/api)

### Frontend Setup

1. Navigate to the frontend directory:

cd client

2. Install dependencies:

npm install

3. Run the application:

npm start


The React application will be available at [http://localhost:3000](http://localhost:3000)

## Test Credentials

After running the seed script, you can use the following credentials to test the application:

- **Admin**: [admin1@example.com](mailto:admin1@example.com) / password
- **Employee**: [employee11@example.com](mailto:employee11@example.com) / password
- **Driver**: [driver11@example.com](mailto:driver11@example.com) / password

