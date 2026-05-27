import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///bookstack.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Import Limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
