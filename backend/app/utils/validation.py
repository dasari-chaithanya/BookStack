import re
from functools import wraps
from flask import request, jsonify

def validate_schema(schema_fields):
    """
    A lightweight manual validation decorator to ensure required fields are present 
    and typed correctly in the JSON payload, avoiding heavy dependencies like Marshmallow.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Bad Request", "message": "Content-Type must be application/json"}), 400
            
            data = request.get_json()
            errors = {}

            for field, constraints in schema_fields.items():
                is_required = constraints.get('required', False)
                field_type = constraints.get('type', str)

                if is_required and field not in data:
                    errors[field] = "This field is required."
                    continue
                
                if field in data and data[field] is not None:
                    if not isinstance(data[field], field_type):
                        errors[field] = f"Must be of type {field_type.__name__}."
                    
                    # URL validation
                    if constraints.get('is_url') and isinstance(data[field], str):
                        if not re.match(r'^https?:\/\/', data[field]):
                            errors[field] = "Must be a valid URL starting with http:// or https://"

            if errors:
                return jsonify({
                    "error": "Validation Error", 
                    "message": "Invalid payload",
                    "fields": errors
                }), 400
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
