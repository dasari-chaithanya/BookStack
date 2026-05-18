from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import re
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
from utils import normalize_url

# Import db, User, Tag, Bookmark, and bookmark_tags from the models file
from models import db, User, Tag, Bookmark, bookmark_tags

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config['SECRET_KEY'] = 'a_very_secret_key_for_your_app_please_change_this_in_production'
app.config['JWT_SECRET_KEY'] = 'jwt_secret_key_for_bookstack_change_this'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://bookstack_user:yourpassword@localhost/bookstack'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with the Flask app
db.init_app(app)
jwt = JWTManager(app)
# This is crucial for allowing credentials (cookies/auth headers) to be sent cross-origin
CORS(app, supports_credentials=True)

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
    return send_from_directory(app.static_folder, 'index.html')

# ----------- Database Initialization (for development) ------------
with app.app_context():
    try:
        db.create_all()
        print("DEBUG: Database tables checked/created.")
    except Exception as e:
        print(f"ERROR: Could not connect to the database. Ensure MySQL is running. {str(e)}")

# ----------- Auth Endpoints ------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    try:
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
            
        if email and User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Hash the password securely
        password_hash = generate_password_hash(password)
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully', 'username': username}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'A database integrity error occurred (duplicate user/email)'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error during registration'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    try:
        user = User.query.filter_by(username=username).first()

        # Check if user exists and password is correct
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Create JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Logged in successfully',
            'token': access_token,
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        }), 200
    except SQLAlchemyError as e:
        return jsonify({'error': 'Internal server error during login'}), 500

@app.route('/api/status', methods=['GET'])
@jwt_required()
def status():
    """
    Returns the current user's status if logged in.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'is_logged_in': True, 'username': user.username}), 200
    except SQLAlchemyError:
        return jsonify({'error': 'Database error'}), 500

# ----------- Bookmarks Endpoints ------------
@app.route('/api/bookmarks', methods=['GET', 'POST'])
@jwt_required()
def bookmarks():
    user_id = get_jwt_identity()

    if request.method == 'GET':
        try:
            bookmarks_data = Bookmark.query.filter_by(user_id=user_id).all()
            return jsonify([b.to_dict() for b in bookmarks_data]), 200
        except SQLAlchemyError:
            return jsonify({'error': 'Failed to fetch bookmarks'}), 500

    if request.method == 'POST':
        data = request.get_json()
        title = data.get('title', 'No Title')
        url = data.get('url')
        notes = data.get('notes', '')
        tag_names = data.get('tags', [])

        if not url or not validate_url(url):
            return jsonify({'error': 'Invalid URL format or missing URL'}), 400

        normalized_url = normalize_url(url)

        # Duplicate check
        existing_bookmark = Bookmark.query.filter_by(user_id=user_id, url=normalized_url).first()
        if existing_bookmark:
            return jsonify({'error': 'Already bookmarked'}), 409

        try:
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
                user_id=user_id,
                title=title,
                url=normalized_url,
                description=notes,
                favicon_url=data.get('favicon_url'),
                image_url=data.get('image_url')
            )
            bookmark.tags = tags
            db.session.add(bookmark)
            db.session.commit()
            return jsonify({'message': 'Bookmark added successfully', 'bookmark': bookmark.to_dict()}), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to add bookmark to database'}), 500

@app.route('/api/bookmarks/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def bookmark_detail(id):
    user_id = get_jwt_identity()
    
    try:
        bookmark = Bookmark.query.filter_by(id=id, user_id=user_id).first()
        if not bookmark:
            return jsonify({'error': 'Bookmark not found or unauthorized'}), 404

        if request.method == 'GET':
            return jsonify(bookmark.to_dict()), 200

        if request.method == 'PUT':
            data = request.get_json()
            
            if 'url' in data and not validate_url(data['url']):
                return jsonify({'error': 'Invalid URL format'}), 400

            bookmark.title = data.get('title', bookmark.title)
            bookmark.url = data.get('url', bookmark.url)
            # Match the model which now uses 'description' instead of 'notes', but handle frontend sending 'notes'
            if 'notes' in data:
                bookmark.description = data['notes']
            elif 'description' in data:
                bookmark.description = data['description']

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
            return jsonify({'message': 'Bookmark updated successfully', 'bookmark': bookmark.to_dict()}), 200

        if request.method == 'DELETE':
            db.session.delete(bookmark)
            db.session.commit()
            return jsonify({'message': 'Bookmark deleted successfully'}), 200
            
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database operation failed'}), 500

# ----------- Tags Endpoints ------------
@app.route('/api/tags', methods=['GET'])
@jwt_required()
def get_tags():
    user_id = get_jwt_identity()
    try:
        tags = Tag.query.join(bookmark_tags).join(Bookmark).filter(Bookmark.user_id == user_id).distinct().all()
        return jsonify([tag.name for tag in tags]), 200
    except SQLAlchemyError:
        return jsonify({'error': 'Failed to fetch tags'}), 500

# ----------- Search Endpoint ------------
@app.route('/api/search', methods=['GET'])
@jwt_required()
def search():
    user_id = get_jwt_identity()
    keyword = request.args.get('keyword', '')
    tag_filter = request.args.get('tag', '')

    try:
        query = Bookmark.query.filter_by(user_id=user_id)

        if keyword:
            search_str = f"%{keyword}%"
            query = query.filter(
                Bookmark.title.ilike(search_str) |
                Bookmark.url.ilike(search_str) |
                Bookmark.description.ilike(search_str)
            )

        if tag_filter:
            tags_to_filter = [t.strip() for t in tag_filter.split(',')]
            for t_name in tags_to_filter:
                query = query.filter(Bookmark.tags.any(Tag.name == t_name))

        bookmarks_found = query.all()
        return jsonify([b.to_dict() for b in bookmarks_found]), 200
    except SQLAlchemyError:
        return jsonify({'error': 'Failed to search bookmarks'}), 500

# ----------- Metadata Endpoint ------------
@app.route('/api/metadata', methods=['GET'])
@jwt_required()
def fetch_metadata():
    url = request.args.get('url')
    if not url or not validate_url(url):
        return jsonify({'error': 'Invalid or missing URL'}), 400
        
    normalized_url = normalize_url(url)
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(normalized_url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 1. Title
        title_tag = soup.find('title')
        title = title_tag.string.strip() if title_tag and title_tag.string else ''
        if not title:
            og_title = soup.find('meta', property='og:title')
            if og_title and og_title.get('content'):
                title = og_title['content'].strip()
                
        # 2. Description
        description = ''
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc['content'].strip()
        else:
            og_desc = soup.find('meta', property='og:description')
            if og_desc and og_desc.get('content'):
                description = og_desc['content'].strip()
                
        # 3. Open Graph Image
        image_url = ''
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            image_url = og_image['content'].strip()
            
        # 4. Favicon
        favicon_url = ''
        icon_link = soup.find('link', rel=lambda r: r and 'icon' in r.lower())
        if icon_link and icon_link.get('href'):
            favicon_url = icon_link['href']
        else:
            favicon_url = '/favicon.ico'
            
        # Make favicon/image URLs absolute if they are relative
        from urllib.parse import urljoin
        if image_url:
            image_url = urljoin(normalized_url, image_url)
        if favicon_url:
            favicon_url = urljoin(normalized_url, favicon_url)

        return jsonify({
            'title': title,
            'description': description,
            'favicon_url': favicon_url,
            'image_url': image_url,
            'normalized_url': normalized_url
        }), 200
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to fetch metadata', 'details': str(e)}), 502
    except Exception as e:
        return jsonify({'error': 'Error processing metadata', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
