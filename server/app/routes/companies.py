from flask import Blueprint, request, jsonify
from app.models import Company, User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

companies_bp = Blueprint('companies', __name__)

@companies_bp.route('/', methods=['GET'])
@jwt_required()
def get_companies():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can see all companies
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    companies = Company.query.all()
    
    return jsonify([company.to_dict() for company in companies]), 200

@companies_bp.route('/<int:company_id>', methods=['GET'])
@jwt_required()
def get_company(company_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    # Users can only see their own company
    if user.company_id != company.id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(company.to_dict()), 200

@companies_bp.route('/', methods=['POST'])
@jwt_required()
def create_company():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can create companies
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Missing required field: name'}), 400
    
    # Create new company
    company = Company(
        name=data['name'],
        industry=data.get('industry', 'Not specified')
    )
    
    db.session.add(company)
    db.session.commit()
    
    return jsonify(company.to_dict()), 201

@companies_bp.route('/<int:company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only admins can update companies
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    company = Company.query.get(company_id)
    
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    # Admins can only update their own company
    if user.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        company.name = data['name']
    
    if 'industry' in data:
        company.industry = data['industry']
    
    db.session.commit()
    
    return jsonify(company.to_dict()), 200
