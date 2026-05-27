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
from models import db, User, Tag, Bookmark, Folder, bookmark_tags

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
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        try:
            # Only return non-deleted bookmarks
            query = Bookmark.query.filter_by(user_id=user_id, deleted_at=None).order_by(Bookmark.created_at.desc())
            
            pagination = query.paginate(page=page, per_page=limit, error_out=False)
            
            return jsonify({
                'items': [b.to_dict() for b in pagination.items],
                'total': pagination.total,
                'page': pagination.page,
                'limit': pagination.per_page,
                'has_more': pagination.has_next
            }), 200
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
                image_url=data.get('image_url'),
                folder_id=data.get('folder_id'),
                source=data.get('source', 'manual'),
                content_type=data.get('content_type', 'other')
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

# ----------- Folders Endpoints ------------
@app.route('/api/folders', methods=['GET', 'POST'])
@jwt_required()
def folders():
    user_id = get_jwt_identity()
    
    if request.method == 'GET':
        try:
            folders_data = Folder.query.filter_by(user_id=user_id, deleted_at=None).order_by(Folder.position.asc()).all()
            return jsonify([f.to_dict() for f in folders_data]), 200
        except SQLAlchemyError:
            return jsonify({'error': 'Failed to fetch folders'}), 500

    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Folder name is required'}), 400
            
        try:
            parent_id = data.get('parent_id')
            if parent_id:
                # Verify parent belongs to user
                parent_folder = Folder.query.filter_by(id=parent_id, user_id=user_id, deleted_at=None).first()
                if not parent_folder:
                    return jsonify({'error': 'Invalid parent folder'}), 400
                    
            folder = Folder(
                user_id=user_id,
                name=name,
                parent_id=parent_id,
                icon=data.get('icon'),
                position=data.get('position', 0)
            )
            db.session.add(folder)
            db.session.commit()
            return jsonify({'message': 'Folder created successfully', 'folder': folder.to_dict()}), 201
        except SQLAlchemyError:
            db.session.rollback()
            return jsonify({'error': 'Failed to create folder'}), 500

@app.route('/api/folders/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def folder_detail(id):
    user_id = get_jwt_identity()
    
    try:
        folder = Folder.query.filter_by(id=id, user_id=user_id).first()
        if not folder:
            return jsonify({'error': 'Folder not found or unauthorized'}), 404
            
        if request.method == 'PUT':
            data = request.get_json()
            new_parent_id = data.get('parent_id', folder.parent_id)
            
            # Cyclic Dependency Check
            if new_parent_id and new_parent_id != folder.parent_id:
                # Validate new parent belongs to user
                new_parent = Folder.query.filter_by(id=new_parent_id, user_id=user_id, deleted_at=None).first()
                if not new_parent:
                    return jsonify({'error': 'Invalid parent folder'}), 400
                    
                # Traverse up to ensure new_parent is not a descendant of current folder (or the current folder itself)
                current_check = new_parent
                while current_check:
                    if current_check.id == folder.id:
                        return jsonify({'error': 'Cyclic folder relationship detected'}), 400
                    if not current_check.parent_id:
                        break
                    current_check = Folder.query.get(current_check.parent_id)
            
            folder.name = data.get('name', folder.name)
            folder.parent_id = new_parent_id
            folder.icon = data.get('icon', folder.icon)
            folder.position = data.get('position', folder.position)
            
            db.session.commit()
            return jsonify({'message': 'Folder updated successfully', 'folder': folder.to_dict()}), 200
            
        if request.method == 'DELETE':
            # Non-Destructive Deletion Policy
            # Move bookmarks to Inbox (root)
            Bookmark.query.filter_by(folder_id=folder.id).update({'folder_id': None})
            
            # Move child folders to root
            Folder.query.filter_by(parent_id=folder.id).update({'parent_id': None})
            
            # Perform hard delete for now (can change to soft delete setting deleted_at later if fully adopted)
            db.session.delete(folder)
            db.session.commit()
            return jsonify({'message': 'Folder deleted successfully. Contents moved to root.'}), 200
            
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database operation failed'}), 500

# ----------- Import / Export Endpoints ------------
@app.route('/api/export', methods=['GET'])
@jwt_required()
def export_bookmarks():
    user_id = get_jwt_identity()
    export_format = request.args.get('format', 'json')
    
    try:
        folders = Folder.query.filter_by(user_id=user_id, deleted_at=None).all()
        bookmarks = Bookmark.query.filter_by(user_id=user_id, deleted_at=None).all()
        
        if export_format == 'html':
            import time
            from flask import Response
            
            html = [
                '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
                '<!-- This is an automatically generated file.',
                '     It will be read and overwritten.',
                '     DO NOT EDIT! -->',
                '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
                '<TITLE>Bookmarks</TITLE>',
                '<H1>Bookmarks</H1>',
                '<DL><p>'
            ]
            
            # Helper to format timestamp
            def to_ts(dt):
                if not dt: return str(int(time.time()))
                return str(int(dt.timestamp()))
                
            # Render root bookmarks
            root_bms = [b for b in bookmarks if not b.folder_id]
            for b in root_bms:
                tags_attr = f' TAGS="{",".join([t.name for t in b.tags])}"' if b.tags else ''
                icon_attr = f' ICON="{b.favicon_url}"' if b.favicon_url else ''
                html.append(f'    <DT><A HREF="{b.url}" ADD_DATE="{to_ts(b.created_at)}"{tags_attr}{icon_attr}>{b.title}</A>')
                
            # Render folders (flat representation for now to avoid deep recursion overhead)
            # In a full tree, we'd recursively build this
            for f in folders:
                html.append(f'    <DT><H3 ADD_DATE="{to_ts(f.created_at)}">{f.name}</H3>')
                html.append('    <DL><p>')
                folder_bms = [b for b in bookmarks if b.folder_id == f.id]
                for b in folder_bms:
                    tags_attr = f' TAGS="{",".join([t.name for t in b.tags])}"' if b.tags else ''
                    icon_attr = f' ICON="{b.favicon_url}"' if b.favicon_url else ''
                    html.append(f'        <DT><A HREF="{b.url}" ADD_DATE="{to_ts(b.created_at)}"{tags_attr}{icon_attr}>{b.title}</A>')
                html.append('    </DL><p>')
                
            html.append('</DL><p>')
            
            return Response('\n'.join(html), mimetype='text/html', headers={'Content-Disposition': 'attachment;filename=bookmarks.html'})
            
        export_data = {
            "folders": [f.to_dict() for f in folders],
            "bookmarks": [b.to_dict() for b in bookmarks]
        }
        return jsonify(export_data), 200
    except SQLAlchemyError:
        return jsonify({'error': 'Failed to export data'}), 500

@app.route('/api/import', methods=['POST'])
@jwt_required()
def import_bookmarks():
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    if not file.filename.endswith('.html'):
        return jsonify({'error': 'Only HTML format is supported for imports'}), 400
        
    try:
        content = file.read().decode('utf-8', errors='ignore')
        soup = BeautifulSoup(content, 'html.parser')
        links = soup.find_all('a')
        
        imported_count = 0
        skipped_count = 0
        
        for link in links:
            url = link.get('href')
            if not url or not validate_url(url):
                continue
                
            normalized_url = normalize_url(url)
            title = link.text.strip() or 'Imported Bookmark'
            
            # Duplicate check
            existing = Bookmark.query.filter_by(user_id=user_id, url=normalized_url).first()
            if existing:
                skipped_count += 1
                continue
                
            bookmark = Bookmark(
                user_id=user_id,
                title=title,
                url=normalized_url,
                source='import'
            )
            db.session.add(bookmark)
            imported_count += 1
            
            # Commit in chunks to avoid memory lockups for massive imports
            if imported_count % 100 == 0:
                db.session.commit()
                
        db.session.commit()
        return jsonify({
            'message': 'Import completed',
            'summary': {
                'imported': imported_count,
                'skipped_duplicates': skipped_count
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process import file', 'details': str(e)}), 500

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
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)

    try:
        query = Bookmark.query.filter_by(user_id=user_id, deleted_at=None)

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

        query = query.order_by(Bookmark.created_at.desc())
        pagination = query.paginate(page=page, per_page=limit, error_out=False)

        return jsonify({
            'items': [b.to_dict() for b in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'limit': pagination.per_page,
            'has_more': pagination.has_next
        }), 200
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
