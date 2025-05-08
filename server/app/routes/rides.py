from flask import Blueprint, request, jsonify
from app.models import Ride, Vehicle, User, Billing
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid

rides_bp = Blueprint('rides', __name__)

@rides_bp.route('/', methods=['GET'])
@jwt_required()
def get_rides():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Filter parameters
    driver_id = request.args.get('driver_id', type=int)
    company_id = request.args.get('company_id', type=int)
    date = request.args.get('date')
    status = request.args.get('status')
    
    # Base query
    query = Ride.query
    
    # Apply filters
    if driver_id:
        query = query.filter_by(driver_id=driver_id)
    
    if company_id:
        query = query.filter_by(company_id=company_id)
    
    if date:
        try:
            filter_date = datetime.strptime(date, '%Y-%m-%d')
            next_day = filter_date + timedelta(days=1)
            query = query.filter(Ride.scheduled_time >= filter_date, Ride.scheduled_time < next_day)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    if status:
        query = query.filter_by(status=status)
    
    # Role-based filtering
    if user.role == 'employee':
        # Employees can only see their own rides
        query = query.filter_by(user_id=user.id)
    elif user.role == 'driver':
        # Drivers can only see rides assigned to them
        query = query.filter_by(driver_id=user.id)
    elif user.role == 'admin':
        # Admins can see all rides for their company
        query = query.filter_by(company_id=user.company_id)
    
    rides = query.all()
    return jsonify([ride.to_dict() for ride in rides]), 200

@rides_bp.route('/<int:ride_id>', methods=['GET'])
@jwt_required()
def get_ride(ride_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    ride = Ride.query.get(ride_id)
    
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    
    # Check permissions
    if user.role == 'employee' and ride.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if user.role == 'driver' and ride.driver_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if user.role == 'admin' and ride.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(ride.to_dict()), 200

@rides_bp.route('/', methods=['POST'])
@jwt_required()
def create_ride():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['pickup_location', 'destination', 'passenger_count', 'scheduled_time', 'vehicle_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate vehicle capacity
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    if data['passenger_count'] > vehicle.capacity:
        return jsonify({'error': f'Passenger count exceeds vehicle capacity of {vehicle.capacity}'}), 400
    
    # Parse scheduled time
    try:
        scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid scheduled_time format. Use ISO format'}), 400
    
    # Create new ride
    ride = Ride(
        pickup_location=data['pickup_location'],
        destination=data['destination'],
        passenger_count=data['passenger_count'],
        scheduled_time=scheduled_time,
        user_id=user.id,
        vehicle_id=data['vehicle_id'],
        company_id=user.company_id,
        driver_id=data.get('driver_id')
    )
    
    db.session.add(ride)
    db.session.commit()
    
    # Create billing record
    due_date = datetime.utcnow() + timedelta(days=30)
    billing = Billing(
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
        amount=calculate_ride_cost(ride),
        due_date=due_date,
        company_id=user.company_id,
        ride_id=ride.id
    )
    
    db.session.add(billing)
    db.session.commit()
    
    return jsonify(ride.to_dict()), 201

@rides_bp.route('/<int:ride_id>', methods=['PUT'])
@jwt_required()
def update_ride(ride_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    ride = Ride.query.get(ride_id)
    
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    
    # Check permissions
    if user.role == 'employee' and ride.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if user.role == 'admin' and ride.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Update fields
    if 'pickup_location' in data:
        ride.pickup_location = data['pickup_location']
    
    if 'destination' in data:
        ride.destination = data['destination']
    
    if 'passenger_count' in data:
        # Validate vehicle capacity
        if data['passenger_count'] > ride.vehicle.capacity:
            return jsonify({'error': f'Passenger count exceeds vehicle capacity of {ride.vehicle.capacity}'}), 400
        ride.passenger_count = data['passenger_count']
    
    if 'scheduled_time' in data:
        try:
            ride.scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid scheduled_time format. Use ISO format'}), 400
    
    if 'status' in data:
        valid_statuses = ['scheduled', 'in-progress', 'completed', 'cancelled']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        ride.status = data['status']
        
        # If status is completed, set completed_time
        if data['status'] == 'completed':
            ride.completed_time = datetime.utcnow()
    
    if 'vehicle_id' in data:
        vehicle = Vehicle.query.get(data['vehicle_id'])
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        if ride.passenger_count > vehicle.capacity:
            return jsonify({'error': f'Passenger count exceeds new vehicle capacity of {vehicle.capacity}'}), 400
        
        ride.vehicle_id = data['vehicle_id']
    
    if 'driver_id' in data and (user.role == 'admin'):
        driver = User.query.get(data['driver_id'])
        if not driver or driver.role != 'driver':
            return jsonify({'error': 'Driver not found'}), 404
        
        ride.driver_id = data['driver_id']
    
    db.session.commit()
    
    return jsonify(ride.to_dict()), 200

@rides_bp.route('/<int:ride_id>', methods=['DELETE'])
@jwt_required()
def delete_ride(ride_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    ride = Ride.query.get(ride_id)
    
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    
    # Check permissions (only admins can delete rides)
    if user.role != 'admin' or ride.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete associated billing
    if ride.billing:
        db.session.delete(ride.billing)
    
    db.session.delete(ride)
    db.session.commit()
    
    return jsonify({'message': 'Ride deleted successfully'}), 200

def calculate_ride_cost(ride):
    # Simple cost calculation based on distance (mocked)
    # In a real app, this would use distance calculation APIs
    base_fare = 10.0
    per_passenger_fee = 2.5
    
    return base_fare + (ride.passenger_count * per_passenger_fee)
