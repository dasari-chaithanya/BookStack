from flask import Blueprint, request, jsonify, g, current_app
from app.middleware.auth import require_auth
from app.services.import_service import ImportService
from app.extensions import limiter

import_bp = Blueprint('imports', __name__)

@import_bp.route('/import', methods=['POST'])
@require_auth
@limiter.limit("5 per minute")
def import_bookmarks():
    if 'file' not in request.files:
        return jsonify({'error': 'Bad Request', 'message': 'No file uploaded'}), 400
        
    file = request.files['file']
    if not file.filename.endswith('.html'):
        return jsonify({'error': 'Bad Request', 'message': 'Only HTML format is supported for imports'}), 400

    # Read content, respecting max content length (already handled by Flask config MAX_CONTENT_LENGTH)
    try:
        content = file.read().decode('utf-8', errors='ignore')
        
        # Hard check on file size locally just in case
        if len(content) > current_app.config['MAX_CONTENT_LENGTH']:
            return jsonify({'error': 'Payload Too Large', 'message': 'File size exceeds limit'}), 413

        result = ImportService.import_html(g.user.id, content)
        
        return jsonify({
            'message': 'Import completed',
            'data': result
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': f"Failed to process import file: {str(e)}"}), 500

@import_bp.route('/export', methods=['GET'])
@require_auth
def export_bookmarks():
    from app.models import Folder, Bookmark
    export_format = request.args.get('format', 'json')
    
    folders = Folder.query.filter_by(user_id=g.user.id, deleted_at=None).all()
    bookmarks = Bookmark.query.filter_by(user_id=g.user.id, deleted_at=None).all()
    
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
        
        def to_ts(dt):
            if not dt: return str(int(time.time()))
            return str(int(dt.timestamp()))
            
        root_bms = [b for b in bookmarks if not b.folder_id]
        for b in root_bms:
            tags_attr = f' TAGS="{",".join([t.name for t in b.tags])}"' if b.tags else ''
            icon_attr = f' ICON="{b.favicon_url}"' if b.favicon_url else ''
            html.append(f'    <DT><A HREF="{b.url}" ADD_DATE="{to_ts(b.created_at)}"{tags_attr}{icon_attr}>{b.title}</A>')
            
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
    return jsonify({"data": export_data}), 200
