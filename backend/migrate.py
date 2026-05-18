import sqlalchemy
from sqlalchemy import create_engine, text

# Using the same database URI from app.py
db_uri = 'mysql+pymysql://bookstack_user:yourpassword@localhost/bookstack'
engine = create_engine(db_uri)

with engine.connect() as conn:
    try:
        # Check if column exists, if not, add it
        conn.execute(text("ALTER TABLE bookmarks ADD COLUMN favicon_url VARCHAR(500);"))
        print("Added favicon_url column.")
    except Exception as e:
        print(f"favicon_url may already exist: {e}")
        
    try:
        conn.execute(text("ALTER TABLE bookmarks ADD COLUMN image_url VARCHAR(500);"))
        print("Added image_url column.")
    except Exception as e:
        print(f"image_url may already exist: {e}")
        
    conn.commit()

print("Migration completed.")
