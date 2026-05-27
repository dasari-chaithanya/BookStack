from .extensions import db

bookmark_tags = db.Table('bookmark_tags',
    db.Column('bookmark_id', db.Integer, db.ForeignKey('bookmarks.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    bookmarks = db.relationship('Bookmark', backref='user', lazy=True)

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Folder(db.Model):
    __tablename__ = 'folders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    icon = db.Column(db.String(50), nullable=True)
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime, nullable=True)

    subfolders = db.relationship('Folder', backref=db.backref('parent', remote_side=[id]))
    bookmarks = db.relationship('Bookmark', backref='folder', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "icon": self.icon,
            "position": self.position,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        }

class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    favicon_url = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    is_favorite = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    last_opened_at = db.Column(db.DateTime, nullable=True)
    visit_count = db.Column(db.Integer, default=0)
    source = db.Column(db.String(20), default='manual')
    content_type = db.Column(db.String(20), default='other')
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime, nullable=True)

    tags = db.relationship('Tag', secondary=bookmark_tags, backref=db.backref('bookmarks_associated', lazy='dynamic'))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "notes": self.description,
            "favicon_url": self.favicon_url,
            "image_url": self.image_url,
            "folder_id": self.folder_id,
            "is_favorite": self.is_favorite,
            "is_archived": self.is_archived,
            "last_opened_at": self.last_opened_at.strftime("%Y-%m-%d %H:%M:%S") if self.last_opened_at else None,
            "visit_count": self.visit_count,
            "source": self.source,
            "content_type": self.content_type,
            "tags": [t.name for t in self.tags],
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        }
