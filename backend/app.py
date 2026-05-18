from flask import Flask, jsonify, request, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import re

# Import db, User, Tag, Bookmark, and bookmark_tags from the models file
from models import db, User, Tag, Bookmark, bookmark_tags

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config['SECRET_KEY'] = 'a_very_secret_key_for_your_app_please_change_this_in_production' # Stronger secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookmarks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with the Flask app
db.init_app(app)

login_manager = LoginManager(app)
# This is crucial for allowing credentials (cookies) to be sent cross-origin
CORS(app, supports_credentials=True)

# User loader callback for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    """
    Required by Flask-Login to reload the user object from the user ID stored in the session.
    """
    print(f"DEBUG: Attempting to load user with ID: {user_id}")
    user = User.query.get(int(user_id))
    if user:
        print(f"DEBUG: User loaded: {user.username}")
    else:
        print(f"DEBUG: User with ID {user_id} not found.")
    return user

# Error handler for unauthorized access (when @login_required fails)
@login_manager.unauthorized_handler
def unauthorized():
    """
    Redirects or returns an error message when a user tries to access a login_required route
    without being authenticated.
    """
    print("DEBUG: Unauthorized access attempt detected.")
    return jsonify({'error': 'Unauthorized access. Please log in.'}), 401

def validate_url(url):
    """
    Validates a given URL string using a regular expression.
    """
    regex = re.compile(
        r'^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$',
        re.IGNORECASE
    )
    return re.match(regex, url) is not None

# Route for serving the frontend's index.html
@app.route('/')
def index():
    """
    Serves the main frontend application file.
    """
    return send_from_directory(app.static_folder, 'index.html')

# ----------- Database Initialization (for development) ------------
# Ensure database tables are created when the app starts
with app.app_context():
    db.create_all()
    print("DEBUG: Database tables checked/created.")

# ----------- Auth Endpoints ------------
@app.route('/api/register', methods=['POST'])
def register():
    """
    Handles user registration.
    Expects 'username' and 'password' in the request JSON.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    print(f"DEBUG: Register attempt - Username: {username}, Password provided.")

    if not username or not password:
        print("DEBUG: Missing username or password during registration.")
        return jsonify({'error': 'Missing username or password'}), 400

    if User.query.filter_by(username=username).first():
        print(f"DEBUG: Username '{username}' already exists.")
        return jsonify({'error': 'Username already exists'}), 400

    # Hash the password before storing it
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    print(f"DEBUG: User '{username}' added to database (ID: {new_user.id}).")

    return jsonify({'message': 'User registered successfully', 'username': username}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """
    Handles user login.
    Expects 'username' and 'password' in the request JSON.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    print(f"DEBUG: Login attempt - Username: {username}, Password provided.")

    user = User.query.filter_by(username=username).first()

    if not user:
        print(f"DEBUG: User '{username}' not found in database.")
        return jsonify({'error': 'Invalid username or password'}), 401

    print(f"DEBUG: User '{username}' found. Checking password.")
    print(f"DEBUG: Stored hash for '{username}': {user.hashed_password}")
    # For security, do NOT print the plain text password from request in production.
    # We are printing it here for debugging ONLY.
    print(f"DEBUG: Provided password for '{username}': {password}")

    # Check if user exists and password is correct
    if not check_password_hash(user.hashed_password, password):
        print("DEBUG: Password hash check FAILED.")
        return jsonify({'error': 'Invalid username or password'}), 401

    login_user(user)
    print(f"DEBUG: User '{username}' logged in successfully.")
    return jsonify({'message': 'Logged in successfully', 'user': {'id': user.id, 'username': user.username}})

@app.route('/api/logout', methods=['POST'])
@login_required # Ensures only logged-in users can logout
def logout():
    """
    Logs out the current user.
    """
    print(f"DEBUG: User '{current_user.username}' attempting to log out.")
    logout_user()
    print("DEBUG: Logout successful.")
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/status', methods=['GET'])
@login_required
def status():
    """
    Returns the current user's status if logged in.
    Can be used by frontend to check session status.
    """
    print(f"DEBUG: Status check for current user: {current_user.username}")
    return jsonify({'is_logged_in': True, 'username': current_user.username}), 200

# ----------- Bookmarks Endpoints ------------
@app.route('/api/bookmarks', methods=['GET', 'POST'])
@login_required
def bookmarks():
    """
    Handles fetching all bookmarks for the current user (GET)
    and adding new bookmarks (POST).
    """
    if request.method == 'GET':
        print(f"DEBUG: Fetching bookmarks for user ID: {current_user.id}")
        bookmarks_data = Bookmark.query.filter_by(user_id=current_user.id).all()
        return jsonify([b.to_dict() for b in bookmarks_data])

    if request.method == 'POST':
        data = request.get_json()
        title = data.get('title', 'No Title')
        url = data.get('url')
        notes = data.get('notes', '')
        tag_names = data.get('tags', [])

        print(f"DEBUG: Adding bookmark for user {current_user.username}: Title='{title}', URL='{url}'")

        if not url or not validate_url(url):
            print(f"DEBUG: Invalid URL: {url}")
            return jsonify({'error': 'Invalid URL format or missing URL'}), 400

        tags = []
        for name in tag_names:
            cleaned_name = name.strip()
            if cleaned_name:
                tag = Tag.query.filter_by(name=cleaned_name).first()
                if not tag:
                    tag = Tag(name=cleaned_name)
                    db.session.add(tag)
                tags.append(tag)

        bookmark = Bookmark(
            user_id=current_user.id,
            title=title,
            url=url,
            notes=notes
        )
        bookmark.tags = tags
        db.session.add(bookmark)
        db.session.commit()
        print(f"DEBUG: Bookmark '{title}' added successfully.")

        return jsonify({'message': 'Bookmark added successfully', 'bookmark': bookmark.to_dict()}), 201

@app.route('/api/bookmarks/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def bookmark_detail(id):
    """
    Handles fetching, updating, and deleting a specific bookmark
    for the current user.
    """
    print(f"DEBUG: Accessing bookmark ID {id} for user {current_user.username}.")
    bookmark = Bookmark.query.filter_by(id=id, user_id=current_user.id).first()
    if not bookmark:
        print(f"DEBUG: Bookmark ID {id} not found or unauthorized for user {current_user.username}.")
        return jsonify({'error': 'Bookmark not found or unauthorized'}), 404

    if request.method == 'GET':
        return jsonify(bookmark.to_dict())

    if request.method == 'PUT':
        data = request.get_json()
        print(f"DEBUG: Updating bookmark ID {id} with data: {data}")
        
        if 'url' in data and not validate_url(data['url']):
            print(f"DEBUG: Invalid URL in update for bookmark ID {id}: {data['url']}")
            return jsonify({'error': 'Invalid URL format'}), 400

        bookmark.title = data.get('title', bookmark.title)
        bookmark.url = data.get('url', bookmark.url)
        bookmark.notes = data.get('notes', bookmark.notes)

        if 'tags' in data:
            tag_names = [t.strip() for t in data['tags']]
            tags = []
            for name in tag_names:
                cleaned_name = name.strip()
                if cleaned_name:
                    tag = Tag.query.filter_by(name=cleaned_name).first()
                    if not tag:
                        tag = Tag(name=cleaned_name)
                        db.session.add(tag)
                    tags.append(tag)
            bookmark.tags = tags

        db.session.commit()
        print(f"DEBUG: Bookmark ID {id} updated successfully.")
        return jsonify({'message': 'Bookmark updated successfully', 'bookmark': bookmark.to_dict()}), 200

    if request.method == 'DELETE':
        print(f"DEBUG: Deleting bookmark ID {id}.")
        db.session.delete(bookmark)
        db.session.commit()
        print(f"DEBUG: Bookmark ID {id} deleted successfully.")
        return jsonify({'message': 'Bookmark deleted successfully'}), 200

# ----------- Tags Endpoints ------------
@app.route('/api/tags', methods=['GET'])
@login_required
def get_tags():
    """
    Returns all tags associated with the current user's bookmarks.
    """
    print(f"DEBUG: Fetching tags for user {current_user.username}.")
    tags = Tag.query.join(bookmark_tags).join(Bookmark).filter(Bookmark.user_id == current_user.id).distinct().all()
    return jsonify([tag.name for tag in tags])

# ----------- Search Endpoint ------------
@app.route('/api/search', methods=['GET'])
@login_required
def search():
    """
    Searches for bookmarks based on a keyword and/or tag filter for the current user.
    Query parameters: 'keyword' (title, URL, notes) and 'tag' (comma-separated tag names).
    """
    keyword = request.args.get('keyword', '')
    tag_filter = request.args.get('tag', '')

    print(f"DEBUG: Search for user {current_user.username}: Keyword='{keyword}', Tag Filter='{tag_filter}'")

    query = Bookmark.query.filter_by(user_id=current_user.id)

    if keyword:
        search_str = f"%{keyword}%"
        query = query.filter(
            Bookmark.title.ilike(search_str) |
            Bookmark.url.ilike(search_str) |
            Bookmark.notes.ilike(search_str)
        )

    if tag_filter:
        tags_to_filter = [t.strip() for t in tag_filter.split(',')]
        for t_name in tags_to_filter:
            query = query.filter(Bookmark.tags.any(Tag.name == t_name))

    bookmarks_found = query.all()
    print(f"DEBUG: Found {len(bookmarks_found)} bookmarks for search.")
    return jsonify([b.to_dict() for b in bookmarks_found])

# Run App
if __name__ == '__main__':
    app.run(debug=True)
