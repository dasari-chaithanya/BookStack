import logging
from flask import Flask, jsonify
from .config import Config
from .extensions import db, migrate, jwt, cors, limiter

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])

    # Configure Logging
    configure_logging(app)

    # Register Global Error Handlers
    register_error_handlers(app)

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.bookmark_routes import bookmark_bp
    from .routes.folder_routes import folder_bp
    from .routes.import_routes import import_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(bookmark_bp, url_prefix='/api')
    app.register_blueprint(folder_bp, url_prefix='/api')
    app.register_blueprint(import_bp, url_prefix='/api')

    # Health Check
    @app.route('/health')
    @limiter.exempt
    def health_check():
        return jsonify({"status": "ok"}), 200

    # Ensure database tables are created when booting on Render
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Failed to create tables: {e}")

    return app

def configure_logging(app):
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    if app.debug:
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        handler.setLevel(logging.DEBUG)
    else:
        # In production, log to a file or a more robust handler
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        handler.setLevel(logging.INFO)
    
    app.logger.handlers.clear()
    app.logger.addHandler(handler)

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized", "message": str(error)}), 401

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": "The requested resource was not found."}), 404
        
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"Server Error: {error}")
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred."}), 500
