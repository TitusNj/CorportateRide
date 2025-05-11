from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import app, db
from app.models import User, Company, Vehicle, Trip
from datetime import datetime

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return make_response(jsonify({'error': 'Missing email or password'}), 400)
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not user.authenticate(data.get('password')):
        return make_response(jsonify({'error': 'Invalid email or password'}), 401)
    
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'companies': [{'id': company.id, 'name': company.name} for company in user.companies]
        }
    })

# Company routes
@app.route('/api/companies', methods=['GET'])
@jwt_required()
def get_companies():
    companies = Company.query.all()
    return jsonify([company.to_dict() for company in companies])

@app.route('/api/companies', methods=['POST'])
def register_company():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'address', 'contact_email', 'contact_phone', 
                      'admin_username', 'admin_email', 'admin_password', 
                      'admin_first_name', 'admin_last_name']
    
    for field in required_fields:
        if field not in data:
            return make_response(jsonify({'error': f'Missing required field: {field}'}), 400)
    
    # Check if company already exists
    existing_company = Company.query.filter_by(name=data['name']).first()
    if existing_company:
        return make_response(jsonify({'error': 'Company already exists'}), 400)
    
    # Check if admin username or email already exists
    existing_user = User.query.filter(
        (User.username == data['admin_username']) | 
        (User.email == data['admin_email'])
    ).first()
    
    if existing_user:
        return make_response(jsonify({'error': 'Admin username or email already exists'}), 400)
    
    # Create new company
    new_company = Company(
        name=data['name'],
        address=data['address'],
        contact_email=data['contact_email'],
        contact_phone=data['contact_phone']
    )
    
    # Create admin user
    admin_user = User(
        username=data['admin_username'],
        email=data['admin_email'],
        first_name=data['admin_first_name'],
        last_name=data['admin_last_name'],
        role='admin',
        phone=data.get('admin_phone', '')
    )
    admin_user.password_hash = data['admin_password']
    
    # Associate admin with company
    admin_user.companies.append(new_company)
    
    # Save to database
    db.session.add(new_company)
    db.session.add(admin_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Company registered successfully',
        'company': new_company.to_dict()
    }), 201

@app.route('/api/companies/<int:id>', methods=['GET'])
@jwt_required()
def get_company(id):
    company = Company.query.get(id)
    if not company:
        return make_response(jsonify({'error': 'Company not found'}), 404)
    
    return jsonify(company.to_dict())

# User routes
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_jwt_identity()
    
    # Only admins can see all users
    if current_user.get('role') != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_jwt_identity()
    
    # Only admins can create users
    if current_user.get('role') != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'company_id']
    
    for field in required_fields:
        if field not in data:
            return make_response(jsonify({'error': f'Missing required field: {field}'}), 400)
    
    # Check if username or email already exists
    existing_user = User.query.filter(
        (User.username == data['username']) | 
        (User.email == data['email'])
    ).first()
    
    if existing_user:
        return make_response(jsonify({'error': 'Username or email already exists'}), 400)
    
    # Check if company exists
    company = Company.query.get(data['company_id'])
    if not company:
        return make_response(jsonify({'error': 'Company not found'}), 404)
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role=data['role'],
        phone=data.get('phone', '')
    )
    new_user.password_hash = data['password']
    
    # Associate user with company
    new_user.companies.append(company)
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': new_user.to_dict()
    }), 201

# Vehicle routes
@app.route('/api/vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    vehicles = Vehicle.query.all()
    return jsonify([vehicle.to_dict() for vehicle in vehicles])

@app.route('/api/vehicles', methods=['POST'])
@jwt_required()
def create_vehicle():
    current_user = get_jwt_identity()
    
    # Only admins can create vehicles
    if current_user.get('role') != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['registration_number', 'model', 'capacity_type', 'capacity']
    
    for field in required_fields:
        if field not in data:
            return make_response(jsonify({'error': f'Missing required field: {field}'}), 400)
    
    # Check if vehicle already exists
    existing_vehicle = Vehicle.query.filter_by(registration_number=data['registration_number']).first()
    if existing_vehicle:
        return make_response(jsonify({'error': 'Vehicle already exists'}), 400)
    
    # Create new vehicle
    new_vehicle = Vehicle(
        registration_number=data['registration_number'],
        model=data['model'],
        capacity_type=data['capacity_type'],
        capacity=data['capacity'],
        status=data.get('status', 'available')
    )
    
    # Save to database
    db.session.add(new_vehicle)
    db.session.commit()
    
    return jsonify({
        'message': 'Vehicle created successfully',
        'vehicle': new_vehicle.to_dict()
    }), 201

@app.route('/api/vehicles/<int:id>', methods=['PUT'])
@jwt_required()
def update_vehicle(id):
    current_user = get_jwt_identity()
    
    # Only admins can update vehicles
    if current_user.get('role') != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    vehicle = Vehicle.query.get(id)
    if not vehicle:
        return make_response(jsonify({'error': 'Vehicle not found'}), 404)
    
    data = request.get_json()
    
    # Update vehicle fields
    if 'model' in data:
        vehicle.model = data['model']
    if 'capacity_type' in data:
        vehicle.capacity_type = data['capacity_type']
    if 'capacity' in data:
        vehicle.capacity = data['capacity']
    if 'status' in data:
        vehicle.status = data['status']
    
    # Save to database
    db.session.commit()
    
    return jsonify({
        'message': 'Vehicle updated successfully',
        'vehicle': vehicle.to_dict()
    })

# Trip routes - Full CRUD operations
@app.route('/api/trips', methods=['GET'])
@jwt_required()
def get_trips():
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    role = current_user.get('role')
    
    # Filter trips based on user role
    if role == 'admin':
        trips = Trip.query.all()
    elif role == 'driver':
        trips = Trip.query.filter_by(driver_id=user_id).all()
    else:  # employee
        trips = Trip.query.filter_by(passenger_id=user_id).all()
    
    return jsonify([trip.to_dict() for trip in trips])

@app.route('/api/trips', methods=['POST'])
@jwt_required()
def create_trip():
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['pickup_location', 'dropoff_location', 'pickup_time']
    
    for field in required_fields:
        if field not in data:
            return make_response(jsonify({'error': f'Missing required field: {field}'}), 400)
    
    # Get user's company if not provided
    company_id = data.get('company_id')
    if not company_id:
        # Get the user's first company
        user = User.query.get(user_id)
        if not user or not user.companies:
            return make_response(jsonify({'error': 'User has no associated company'}), 400)
        company_id = user.companies[0].id
    else:
        # Check if company exists
        company = Company.query.get(company_id)
        if not company:
            return make_response(jsonify({'error': 'Company not found'}), 404)
    
    # Parse pickup time
    try:
        pickup_time = datetime.fromisoformat(data['pickup_time'].replace('Z', '+00:00'))
    except ValueError:
        return make_response(jsonify({'error': 'Invalid pickup time format'}), 400)
    
    # Create new trip
    new_trip = Trip(
        pickup_location=data['pickup_location'],
        dropoff_location=data['dropoff_location'],
        pickup_time=pickup_time,
        status='pending',
        passenger_id=user_id,
        company_id=company_id,
        notes=data.get('notes', '')
    )
    
    # Save to database
    db.session.add(new_trip)
    db.session.commit()
    
    return jsonify({
        'message': 'Trip created successfully',
        'trip': new_trip.to_dict()
    }), 201

@app.route('/api/trips/<int:id>', methods=['GET'])
@jwt_required()
def get_trip(id):
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    role = current_user.get('role')
    
    trip = Trip.query.get(id)
    if not trip:
        return make_response(jsonify({'error': 'Trip not found'}), 404)
    
    # Check if user has access to this trip
    if role != 'admin' and trip.passenger_id != user_id and trip.driver_id != user_id:
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    return jsonify(trip.to_dict())

@app.route('/api/trips/<int:id>', methods=['PUT'])
@jwt_required()
def update_trip(id):
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    role = current_user.get('role')
    
    trip = Trip.query.get(id)
    if not trip:
        return make_response(jsonify({'error': 'Trip not found'}), 404)
    
    # Check if user has access to update this trip
    if role != 'admin' and trip.passenger_id != user_id and trip.driver_id != user_id:
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    data = request.get_json()
    
    # Update trip fields
    if 'pickup_location' in data and role in ['admin', 'employee'] and trip.status == 'pending':
        trip.pickup_location = data['pickup_location']
    
    if 'dropoff_location' in data and role in ['admin', 'employee'] and trip.status == 'pending':
        trip.dropoff_location = data['dropoff_location']
    
    if 'pickup_time' in data and role in ['admin', 'employee'] and trip.status == 'pending':
        try:
            pickup_time = datetime.fromisoformat(data['pickup_time'].replace('Z', '+00:00'))
            trip.pickup_time = pickup_time
        except ValueError:
            return make_response(jsonify({'error': 'Invalid pickup time format'}), 400)
    
    if 'status' in data:
        # Validate status transitions
        valid_transitions = {
            'pending': ['in_progress', 'cancelled'],
            'in_progress': ['completed'],
            'completed': [],
            'cancelled': []
        }
        
        if data['status'] not in valid_transitions[trip.status]:
            return make_response(jsonify({'error': f'Invalid status transition from {trip.status} to {data["status"]}'}), 400)
        
        # Check if user has permission to change status
        if data['status'] == 'in_progress' and role not in ['admin', 'driver']:
            return make_response(jsonify({'error': 'Only drivers or admins can start trips'}), 403)
        
        if data['status'] == 'completed' and role not in ['admin', 'driver']:
            return make_response(jsonify({'error': 'Only drivers or admins can complete trips'}), 403)
        
        trip.status = data['status']
        
        # Set completed_at timestamp if trip is completed
        if data['status'] == 'completed':
            trip.completed_at = datetime.utcnow()
    
    if 'driver_id' in data and role == 'admin':
        driver = User.query.get(data['driver_id'])
        if not driver:
            return make_response(jsonify({'error': 'Driver not found'}), 404)
        if driver.role != 'driver':
            return make_response(jsonify({'error': 'User is not a driver'}), 400)
        trip.driver_id = data['driver_id']
    
    if 'vehicle_id' in data and role == 'admin':
        vehicle = Vehicle.query.get(data['vehicle_id'])
        if not vehicle:
            return make_response(jsonify({'error': 'Vehicle not found'}), 404)
        trip.vehicle_id = data['vehicle_id']
    
    if 'notes' in data:
        trip.notes = data['notes']
    
    # Save to database
    db.session.commit()
    
    return jsonify({
        'message': 'Trip updated successfully',
        'trip': trip.to_dict()
    })

@app.route('/api/trips/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_trip(id):
    current_user = get_jwt_identity()
    role = current_user.get('role')
    
    # Only admins can delete trips
    if role != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    trip = Trip.query.get(id)
    if not trip:
        return make_response(jsonify({'error': 'Trip not found'}), 404)
    
    # Delete trip
    db.session.delete(trip)
    db.session.commit()
    
    return jsonify({
        'message': 'Trip deleted successfully'
    })

# Driver assignment routes
@app.route('/api/drivers/assign', methods=['POST'])
@jwt_required()
def assign_driver():
    current_user = get_jwt_identity()
    
    # Only admins can assign drivers
    if current_user.get('role') != 'admin':
        return make_response(jsonify({'error': 'Unauthorized'}), 403)
    
    data = request.get_json()
    
    if not data or not data.get('driver_id') or not data.get('vehicle_id'):
        return make_response(jsonify({'error': 'Missing driver_id or vehicle_id'}), 400)
    
    driver = User.query.get(data['driver_id'])
    if not driver:
        return make_response(jsonify({'error': 'Driver not found'}), 404)
    
    if driver.role != 'driver':
        return make_response(jsonify({'error': 'User is not a driver'}), 400)
    
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return make_response(jsonify({'error': 'Vehicle not found'}), 404)
    
    # Assign driver to vehicle
    if vehicle not in driver.vehicles:
        driver.vehicles.append(vehicle)
        db.session.commit()
    
    return jsonify({
        'message': 'Driver assigned to vehicle successfully'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

@app.errorhandler(400)
def bad_request(error):
    return make_response(jsonify({'error': 'Bad request'}), 400)

@app.errorhandler(500)
def internal_error(error):
    return make_response(jsonify({'error': 'Internal server error'}), 500)
