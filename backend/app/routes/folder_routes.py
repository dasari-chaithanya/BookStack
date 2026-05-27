from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models import Folder, Bookmark
from app.middleware.auth import require_auth
from app.utils.validation import validate_schema

folder_bp = Blueprint('folders', __name__)

@folder_bp.route('/folders', methods=['GET'])
@require_auth
def get_folders():
    folders_data = Folder.query.filter_by(user_id=g.user.id, deleted_at=None).order_by(Folder.position.asc()).all()
    return jsonify({'data': [f.to_dict() for f in folders_data]}), 200

@folder_bp.route('/folders', methods=['POST'])
@require_auth
@validate_schema({
    'name': {'type': str, 'required': True},
    'parent_id': {'type': int, 'required': False},
    'icon': {'type': str, 'required': False},
    'position': {'type': int, 'required': False}
})
def create_folder():
    data = request.get_json()
    parent_id = data.get('parent_id')

    if parent_id:
        parent_folder = Folder.query.filter_by(id=parent_id, user_id=g.user.id, deleted_at=None).first()
        if not parent_folder:
            return jsonify({'error': 'Bad Request', 'message': 'Invalid parent folder'}), 400

    folder = Folder(
        user_id=g.user.id,
        name=data['name'],
        parent_id=parent_id,
        icon=data.get('icon'),
        position=data.get('position', 0)
    )
    db.session.add(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder created', 'data': {'folder': folder.to_dict()}}), 201

@folder_bp.route('/folders/<int:id>', methods=['PUT'])
@require_auth
@validate_schema({
    'name': {'type': str, 'required': False},
    'parent_id': {'type': int, 'required': False},
    'icon': {'type': str, 'required': False},
    'position': {'type': int, 'required': False}
})
def update_folder(id):
    folder = Folder.query.filter_by(id=id, user_id=g.user.id).first()
    if not folder:
        return jsonify({'error': 'Not Found', 'message': 'Folder not found'}), 404

    data = request.get_json()
    new_parent_id = data.get('parent_id', folder.parent_id)

    if new_parent_id and new_parent_id != folder.parent_id:
        new_parent = Folder.query.filter_by(id=new_parent_id, user_id=g.user.id, deleted_at=None).first()
        if not new_parent:
            return jsonify({'error': 'Bad Request', 'message': 'Invalid parent folder'}), 400

        current_check = new_parent
        while current_check:
            if current_check.id == folder.id:
                return jsonify({'error': 'Bad Request', 'message': 'Cyclic folder relationship detected'}), 400
            if not current_check.parent_id:
                break
            current_check = Folder.query.get(current_check.parent_id)

    if 'name' in data: folder.name = data['name']
    folder.parent_id = new_parent_id
    if 'icon' in data: folder.icon = data['icon']
    if 'position' in data: folder.position = data['position']

    db.session.commit()
    return jsonify({'message': 'Folder updated', 'data': {'folder': folder.to_dict()}}), 200

@folder_bp.route('/folders/<int:id>', methods=['DELETE'])
@require_auth
def delete_folder(id):
    folder = Folder.query.filter_by(id=id, user_id=g.user.id).first()
    if not folder:
        return jsonify({'error': 'Not Found', 'message': 'Folder not found'}), 404

    # Non-Destructive Deletion Policy: Move bookmarks to Inbox (root)
    Bookmark.query.filter_by(folder_id=folder.id).update({'folder_id': None})
    
    # Move child folders to root
    Folder.query.filter_by(parent_id=folder.id).update({'parent_id': None})
    
    db.session.delete(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder deleted successfully. Contents moved to root.'}), 200
