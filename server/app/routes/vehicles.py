from flask import Blueprint, request, jsonify
from app.models import Vehicle, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

vehicles_bp = Blueprint('vehicles', __name__)

@vehicles_bp.route('/', methods=['GET'])
@jwt_required()
def get_vehicles():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Filter parameters
    vehicle_type = request.args.get('type')
    status = request.args.get('status')
    
    # Base query
    query = Vehicle.query
    
    # Apply filters
    if vehicle_type:
        query = query.filter_by(type=vehicle_type)
    
    if status:
        query = query.filter_by(status=status)
    
    # Get all vehicles
    vehicles = query.all()
    
    return jsonify([vehicle.to_dict() for vehicle in vehicles]), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    return jsonify(vehicle.to_dict()), 200

@vehicles_bp.route('/', methods=['POST'])
@jwt_required()
def create_vehicle():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can create vehicles
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['type', 'license_plate', 'capacity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if license plate already exists
    if Vehicle.query.filter_by(license_plate=data['license_plate']).first():
        return jsonify({'error': 'License plate already registered'}), 400
    
    # Create new vehicle
    vehicle = Vehicle(
        type=data['type'],
        license_plate=data['license_plate'],
        capacity=data['capacity'],
        status=data.get('status', 'available')
    )
    
    db.session.add(vehicle)
    db.session.commit()
    
    return jsonify(vehicle.to_dict()), 201

@vehicles_bp.route('/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can update vehicles
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'type' in data:
        vehicle.type = data['type']
    
    if 'license_plate' in data:
        # Check if license plate already exists
        existing = Vehicle.query.filter_by(license_plate=data['license_plate']).first()
        if existing and existing.id != vehicle_id:
            return jsonify({'error': 'License plate already registered'}), 400
        
        vehicle.license_plate = data['license_plate']
    
    if 'capacity' in data:
        vehicle.capacity = data['capacity']
    
    if 'status' in data:
        valid_statuses = ['available', 'in-use', 'maintenance']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        vehicle.status = data['status']
    
    db.session.commit()
    
    return jsonify(vehicle.to_dict()), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can delete vehicles
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    # Check if vehicle is associated with any rides
    if vehicle.rides:
        return jsonify({'error': 'Cannot delete vehicle with associated rides'}), 400
    
    db.session.delete(vehicle)
    db.session.commit()
    
    return jsonify({'message': 'Vehicle deleted successfully'}), 200

@vehicles_bp.route('/<int:vehicle_id>/drivers', methods=['POST'])
@jwt_required()
def assign_driver(vehicle_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can assign drivers
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    data = request.get_json()
    
    if 'driver_id' not in data:
        return jsonify({'error': 'Missing driver_id'}), 400
    
    driver = User.query.get(data['driver_id'])
    
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    # Check if driver is already assigned to this vehicle
    if driver in vehicle.drivers:
        return jsonify({'error': 'Driver already assigned to this vehicle'}), 400
    
    # Assign driver to vehicle
    vehicle.drivers.append(driver)
    db.session.commit()
    
    return jsonify({'message': 'Driver assigned successfully'}), 200

@vehicles_bp.route('/<int:vehicle_id>/drivers/<int:driver_id>', methods=['DELETE'])
@jwt_required()
def remove_driver(vehicle_id, driver_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can remove drivers
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    vehicle = Vehicle.query.get(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    driver = User.query.get(driver_id)
    
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    # Check if driver is assigned to this vehicle
    if driver not in vehicle.drivers:
        return jsonify({'error': 'Driver not assigned to this vehicle'}), 400
    
    # Remove driver from vehicle
    vehicle.drivers.remove(driver)
    db.session.commit()
    
    return jsonify({'message': 'Driver removed successfully'}), 200
