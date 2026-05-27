from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_auth
from app.services.bookmark_service import BookmarkService
from app.services.metadata import fetch_metadata
from app.utils.validation import validate_schema

bookmark_bp = Blueprint('bookmarks', __name__)

@bookmark_bp.route('/bookmarks', methods=['GET'])
@require_auth
def get_bookmarks():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    keyword = request.args.get('keyword', '')
    tag = request.args.get('tag', '')
    folder_id = request.args.get('folder_id', type=int)

    data = BookmarkService.get_bookmarks(
        user_id=g.user.id,
        keyword=keyword,
        tag_filter=tag,
        folder_id=folder_id,
        page=page,
        limit=limit
    )
    return jsonify({'data': data}), 200

@bookmark_bp.route('/search', methods=['GET'])
@require_auth
def search_bookmarks():
    # Identical to get_bookmarks but mapped to /search for legacy frontend compat
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    keyword = request.args.get('keyword', '')
    tag = request.args.get('tag', '')
    folder_id = request.args.get('folder_id', type=int)

    data = BookmarkService.get_bookmarks(
        user_id=g.user.id,
        keyword=keyword,
        tag_filter=tag,
        folder_id=folder_id,
        page=page,
        limit=limit
    )
    return jsonify({'data': data}), 200

@bookmark_bp.route('/bookmarks', methods=['POST'])
@require_auth
@validate_schema({
    'url': {'type': str, 'required': True, 'is_url': True},
    'title': {'type': str, 'required': False},
    'notes': {'type': str, 'required': False},
    'tags': {'type': list, 'required': False}
})
def add_bookmark():
    data = request.get_json()
    url = data['url']
    
    # Try fetching metadata if title/favicon not provided, but frontend usually provides it
    title = data.get('title')
    favicon_url = data.get('favicon_url')
    image_url = data.get('image_url')
    
    if not title:
        try:
            meta = fetch_metadata(url)
            title = meta.get('title', 'No Title')
            favicon_url = meta.get('favicon_url')
            image_url = meta.get('image_url')
            url = meta.get('normalized_url', url)
        except Exception:
            title = 'No Title'

    try:
        bookmark = BookmarkService.create_bookmark(
            user_id=g.user.id,
            normalized_url=url,
            title=title,
            notes=data.get('notes', ''),
            tag_names=data.get('tags', []),
            favicon_url=favicon_url,
            image_url=image_url,
            folder_id=data.get('folder_id'),
            source=data.get('source', 'manual'),
            content_type=data.get('content_type', 'other')
        )
    except ValueError as e:
        return jsonify({'error': 'Conflict', 'message': str(e)}), 409
    except Exception as e:
        return jsonify({'error': 'Server Error', 'message': str(e)}), 500
    
    return jsonify({'message': 'Bookmark added', 'data': {'bookmark': bookmark.to_dict()}}), 201

@bookmark_bp.route('/bookmarks/<int:id>', methods=['PUT'])
@require_auth
@validate_schema({
    'url': {'type': str, 'required': False, 'is_url': True},
    'title': {'type': str, 'required': False},
    'notes': {'type': str, 'required': False},
    'tags': {'type': list, 'required': False}
})
def update_bookmark(id):
    try:
        data = request.get_json()
        bookmark = BookmarkService.update_bookmark(g.user.id, id, data)
        return jsonify({'message': 'Bookmark updated', 'data': {'bookmark': bookmark.to_dict()}}), 200
    except ValueError as e:
        return jsonify({'error': 'Not Found', 'message': str(e)}), 404

@bookmark_bp.route('/bookmarks/<int:id>', methods=['DELETE'])
@require_auth
def delete_bookmark(id):
    try:
        BookmarkService.delete_bookmark(g.user.id, id)
        return jsonify({'message': 'Bookmark deleted successfully'}), 200
    except ValueError as e:
        return jsonify({'error': 'Not Found', 'message': str(e)}), 404

@bookmark_bp.route('/tags', methods=['GET'])
@require_auth
def get_tags():
    from app.models import Tag, bookmark_tags, Bookmark
    tags = Tag.query.join(bookmark_tags).join(Bookmark).filter(Bookmark.user_id == g.user.id).distinct().all()
    return jsonify({'data': [tag.name for tag in tags]}), 200

@bookmark_bp.route('/metadata', methods=['GET'])
@require_auth
def get_metadata():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'Bad Request', 'message': 'Missing URL'}), 400
        
    meta = fetch_metadata(url)
    return jsonify({'data': meta}), 200
