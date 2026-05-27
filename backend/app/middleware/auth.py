from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Verify the JWT is present and valid
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            # Verify the user actually exists in the database
            user = User.query.get(int(current_user_id))
            if not user:
                return jsonify({"error": "Unauthorized", "message": "User not found or deleted"}), 401
                
            # Attach the user to the Flask global context
            g.user = user
            
        except Exception as e:
            return jsonify({"error": "Unauthorized", "message": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated_function
