import pytest
from app import create_app
from app.extensions import db
from app.models import User

@pytest.fixture
def app():
    # Use in-memory SQLite for testing to avoid touching production DB
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        SECRET_KEY = 'test-secret'
        JWT_SECRET_KEY = 'test-jwt-secret'
        CORS_ORIGINS = ['*']
        RATELIMIT_ENABLED = False # Disable rate limits for testing

    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client, app):
    with app.app_context():
        from werkzeug.security import generate_password_hash
        user = User(username="testuser", password_hash=generate_password_hash("password"))
        db.session.add(user)
        db.session.commit()
        
        res = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'password'
        })
        token = res.get_json()['data']['token']
        return {'Authorization': f'Bearer {token}'}
