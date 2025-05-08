from flask import Blueprint, request, jsonify
from app.models import Billing, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/', methods=['GET'])
@jwt_required()
def get_billings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Filter parameters
    status = request.args.get('status')
    
    # Base query
    query = Billing.query
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    
    # Role-based filtering
    if user.role == 'admin':
        # Admins can see all billings for their company
        query = query.filter_by(company_id=user.company_id)
    else:
        # Other roles can't access billing
        return jsonify({'error': 'Unauthorized'}), 403
    
    billings = query.all()
    
    return jsonify([billing.to_dict() for billing in billings]), 200

@billing_bp.route('/<int:billing_id>', methods=['GET'])
@jwt_required()
def get_billing(billing_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    billing = Billing.query.get(billing_id)
    
    if not billing:
        return jsonify({'error': 'Billing not found'}), 404
    
    # Check permissions
    if user.role != 'admin' or billing.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(billing.to_dict()), 200

@billing_bp.route('/<int:billing_id>', methods=['PUT'])
@jwt_required()
def update_billing(billing_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can update billings
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    billing = Billing.query.get(billing_id)
    
    if not billing:
        return jsonify({'error': 'Billing not found'}), 404
    
    # Admins can only update billings for their company
    if billing.company_id != user.company_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Update fields
    if 'status' in data:
        valid_statuses = ['pending', 'paid', 'overdue']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        billing.status = data['status']
    
    if 'amount' in data:
        billing.amount = data['amount']
    
    if 'due_date' in data:
        try:
            billing.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid due_date format. Use ISO format'}), 400
    
    db.session.commit()
    
    return jsonify(billing.to_dict()), 200
