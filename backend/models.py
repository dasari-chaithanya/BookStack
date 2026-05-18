from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# Initialize SQLAlchemy outside the app factory, to be associated later
db = SQLAlchemy()

# Association table for the many-to-many relationship between Bookmark and Tag
# This is standard for SQLAlchemy when you don't need extra columns on the join table itself.
bookmark_tags = db.Table('bookmark_tags',
    db.Column('bookmark_id', db.Integer, db.ForeignKey('bookmark.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    """
    User model for authentication.
    UserMixin provides default implementations for methods that Flask-Login expects.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    hashed_password = db.Column(db.String(120), nullable=False)

    # Define relationship to bookmarks. 'backref' allows accessing the User from a Bookmark object (e.g., bookmark.user).
    bookmarks = db.relationship('Bookmark', backref='user', lazy=True)

    def __repr__(self):
        """
        String representation for debugging.
        """
        return f'<User {self.username}>'

class Tag(db.Model):
    """
    Tag model for categorizing bookmarks.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        """
        String representation for debugging.
        """
        return f'<Tag {self.name}>'

class Bookmark(db.Model):
    """
    Bookmark model to store user's saved links.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Define many-to-many relationship with Tag via the association table (bookmark_tags).
    # 'backref' creates a dynamic query object on Tag objects (e.g., tag.bookmarks_associated).
    tags = db.relationship('Tag', secondary=bookmark_tags, backref=db.backref('bookmarks_associated', lazy='dynamic'))

    def __repr__(self):
        """
        String representation for debugging.
        """
        return f'<Bookmark {self.title}>'

    def to_dict(self):
        """
        Converts a Bookmark object to a dictionary for JSON serialization,
        including associated tags.
        """
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "notes": self.notes,
            "tags": [t.name for t in self.tags], # Include tags in the dictionary output
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

