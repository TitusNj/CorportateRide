Cabrix, a corporate taxi service, with a Flask backend and React frontend. The application allows companies to register, employees to request taxi services, drivers to manage trips, and admins to oversee the entire system.

### Backend Features

1. **Flask API with SQLAlchemy**: The backend uses Flask for routing and SQLAlchemy for database interactions.
2. **Models**: Implemented 4 models (User, Company, Vehicle, Trip) with appropriate relationships.
3. **Many-to-Many Relationships**: Between User-Company and Driver-Vehicle.
4. **Authentication**: JWT-based authentication for secure access.
5. **Full CRUD Operations**: Complete CRUD functionality for the Trip model.
6. **Validations**: Input validation and error handling throughout the API.


### Frontend Features

1. **React with JavaScript**: Built using React with JavaScript (not TypeScript).
2. **5 Client-Side Routes**: Login, Employee Dashboard, Driver Dashboard, Admin Dashboard, and Company Registration.
3. **Context API**: Used for state management (AuthContext).
4. **Role-Based Access**: Different views for employees, drivers, and admins.
5. **Responsive Design**: Works well on both desktop and mobile devices.


### How to Run the Project

1. **Backend Setup**:

```shellscript
cd server
pipenv install
pipenv shell
python seed.py  # Seed the database with initial data
python run.py   # Start the Flask server
```


2. **Frontend Setup**:

```shellscript
cd client
npm install
npm start
```


3. **Login Credentials** (from seed data):

1. Admin: username: `admin1@cabrix.co.ke`, password: `password123`
2. Employee: username: `employee1@safaricombusiness.co.ke`, password: `password123`
3. Driver: username: `driver6@cabrix.co.ke`, password: `password123`





### Key Features by User Role

1. **Employees can**:

1. Request new taxi trips
2. View their trip history
3. Cancel pending trips
4. View available vehicles



2. **Drivers can**:

1. View assigned trips
2. Update trip status (start/complete)
3. View assigned vehicles



3. **Admins can**:

1. Manage all trips (assign drivers/vehicles, delete)
2. Manage users (create new users)
3. Manage vehicles (add new vehicles, update status)
4. Generate reports and view billing information