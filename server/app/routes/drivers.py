from flask import Blueprint, request, jsonify
from app.models import User, Vehicle
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

drivers_bp = Blueprint('drivers', __name__)

@drivers_bp.route('/', methods=['GET'])
@jwt_required()
def get_drivers():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can see all drivers
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all drivers for the company
    drivers = User.query.filter_by(role='driver', company_id=user.company_id).all()
    
    return jsonify([driver.to_dict() for driver in drivers]), 200

@drivers_bp.route('/<int:driver_id>', methods=['GET'])
@jwt_required()
def get_driver(driver_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    driver = User.query.get(driver_id)
    
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    # Check permissions
    if user.role != 'admin' or driver.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(driver.to_dict()), 200

@drivers_bp.route('/<int:driver_id>/vehicles', methods=['GET'])
@jwt_required()
def get_driver_vehicles(driver_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    driver = User.query.get(driver_id)
    
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    # Check permissions
    if user.role != 'admin' and user.id != driver_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify([vehicle.to_dict() for vehicle in driver.assigned_vehicles]), 200
