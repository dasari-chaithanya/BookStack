from app.extensions import db
from app.models import Bookmark, Tag
from sqlalchemy.exc import SQLAlchemyError

class BookmarkService:
    @staticmethod
    def get_bookmarks(user_id, keyword='', tag_filter='', folder_id=None, page=1, limit=50):
        try:
            query = Bookmark.query.filter_by(user_id=user_id, deleted_at=None)

            if folder_id is not None:
                query = query.filter_by(folder_id=folder_id)

            if keyword:
                search_str = f"%{keyword}%"
                query = query.filter(
                    Bookmark.title.ilike(search_str) |
                    Bookmark.url.ilike(search_str) |
                    Bookmark.description.ilike(search_str)
                )

            if tag_filter:
                tags_to_filter = [t.strip() for t in tag_filter.split(',') if t.strip()]
                for t_name in tags_to_filter:
                    query = query.filter(Bookmark.tags.any(Tag.name == t_name))

            query = query.order_by(Bookmark.created_at.desc())
            pagination = query.paginate(page=page, per_page=limit, error_out=False)

            return {
                'items': [b.to_dict() for b in pagination.items],
                'total': pagination.total,
                'page': pagination.page,
                'limit': pagination.per_page,
                'has_more': pagination.has_next
            }
        except SQLAlchemyError as e:
            raise Exception("Failed to fetch bookmarks: " + str(e))

    @staticmethod
    def create_bookmark(user_id, normalized_url, title, notes, tag_names, favicon_url=None, image_url=None, folder_id=None, source='manual', content_type='other'):
        existing_bookmark = Bookmark.query.filter_by(user_id=user_id, url=normalized_url).first()
        if existing_bookmark:
            raise ValueError("Already bookmarked")

        try:
            tags = BookmarkService._get_or_create_tags(tag_names)
            bookmark = Bookmark(
                user_id=user_id,
                title=title,
                url=normalized_url,
                description=notes,
                favicon_url=favicon_url,
                image_url=image_url,
                folder_id=folder_id,
                source=source,
                content_type=content_type
            )
            bookmark.tags = tags
            db.session.add(bookmark)
            db.session.commit()
            return bookmark
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception("Database error: " + str(e))

    @staticmethod
    def update_bookmark(user_id, bookmark_id, data):
        try:
            bookmark = Bookmark.query.filter_by(id=bookmark_id, user_id=user_id).first()
            if not bookmark:
                raise ValueError("Bookmark not found")

            if 'title' in data: bookmark.title = data['title']
            if 'url' in data: bookmark.url = data['url']
            
            if 'notes' in data: bookmark.description = data['notes']
            elif 'description' in data: bookmark.description = data['description']

            if 'tags' in data:
                bookmark.tags = BookmarkService._get_or_create_tags(data['tags'])

            if 'folder_id' in data:
                bookmark.folder_id = data['folder_id']

            db.session.commit()
            return bookmark
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception("Database error: " + str(e))

    @staticmethod
    def delete_bookmark(user_id, bookmark_id):
        try:
            bookmark = Bookmark.query.filter_by(id=bookmark_id, user_id=user_id).first()
            if not bookmark:
                raise ValueError("Bookmark not found")
            db.session.delete(bookmark)
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            raise Exception("Database error: " + str(e))

    @staticmethod
    def _get_or_create_tags(tag_names):
        tags = []
        for name in tag_names:
            cleaned_name = name.strip()
            if cleaned_name:
                tag = Tag.query.filter_by(name=cleaned_name).first()
                if not tag:
                    tag = Tag(name=cleaned_name)
                    db.session.add(tag)
                tags.append(tag)
        return tags
