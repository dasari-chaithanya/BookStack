from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.extensions import db, limiter
from app.models import User
from app.middleware.auth import require_auth
from app.utils.validation import validate_schema

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
@validate_schema({
    'username': {'type': str, 'required': True},
    'password': {'type': str, 'required': True},
    'email': {'type': str, 'required': False}
})
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']
    email = data.get('email')

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Conflict', 'message': 'Username already exists'}), 409
        
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Conflict', 'message': 'Email already registered'}), 409

    password_hash = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully', 'data': {'username': username}}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
@validate_schema({
    'username': {'type': str, 'required': True},
    'password': {'type': str, 'required': True}
})
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid username or password'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Logged in successfully',
        'data': {
            'token': access_token,
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        }
    }), 200

@auth_bp.route('/status', methods=['GET'])
@require_auth
def status():
    return jsonify({
        'message': 'Status active',
        'data': {'is_logged_in': True, 'username': g.user.username}
    }), 200
