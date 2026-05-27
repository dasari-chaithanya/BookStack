import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-key')
    # Render provides URLs starting with 'postgres://', but SQLAlchemy needs 'postgresql://'
    _db_uri = os.environ.get('DATABASE_URL') or os.environ.get('SQLALCHEMY_DATABASE_URI') or 'sqlite:///bookstack.db'
    
    # Clean up any whitespace/newlines accidentally pasted
    _db_uri = _db_uri.strip()
    
    if _db_uri.startswith('postgres://'):
        _db_uri = _db_uri.replace('postgres://', 'postgresql://', 1)
        
    # If the user accidentally pasted plain text (like "Internal Database URL"), fallback to sqlite so it doesn't crash
    if not _db_uri.startswith(('postgresql://', 'sqlite://', 'mysql://')):
        print(f"WARNING: Invalid database URL provided: {_db_uri}. Falling back to SQLite.")
        _db_uri = 'sqlite:///bookstack.db'
    
    SQLALCHEMY_DATABASE_URI = _db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Import Limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
