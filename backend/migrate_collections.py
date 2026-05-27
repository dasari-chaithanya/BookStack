import pymysql

def migrate():
    # Connect to the database
    connection = pymysql.connect(
        host='localhost',
        user='bookstack_user',
        password='yourpassword',
        database='bookstack',
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with connection.cursor() as cursor:
            # 1. Create folders table
            print("Creating folders table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS folders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    parent_id INT DEFAULT NULL,
                    icon VARCHAR(50) DEFAULT NULL,
                    position INT DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted_at DATETIME DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (parent_id) REFERENCES folders(id)
                )
            """)

            # 2. Alter bookmarks table
            print("Altering bookmarks table...")
            # Check existing columns to avoid duplicate column errors
            cursor.execute("SHOW COLUMNS FROM bookmarks")
            columns = [col['Field'] for col in cursor.fetchall()]

            alter_statements = []
            if 'folder_id' not in columns:
                alter_statements.append("ADD COLUMN folder_id INT DEFAULT NULL")
            if 'is_favorite' not in columns:
                alter_statements.append("ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE")
            if 'is_archived' not in columns:
                alter_statements.append("ADD COLUMN is_archived BOOLEAN DEFAULT FALSE")
            if 'last_opened_at' not in columns:
                alter_statements.append("ADD COLUMN last_opened_at DATETIME DEFAULT NULL")
            if 'visit_count' not in columns:
                alter_statements.append("ADD COLUMN visit_count INT DEFAULT 0")
            if 'source' not in columns:
                alter_statements.append("ADD COLUMN source VARCHAR(20) DEFAULT 'manual'")
            if 'content_type' not in columns:
                alter_statements.append("ADD COLUMN content_type VARCHAR(20) DEFAULT 'other'")
            if 'updated_at' not in columns:
                alter_statements.append("ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
            if 'deleted_at' not in columns:
                alter_statements.append("ADD COLUMN deleted_at DATETIME DEFAULT NULL")

            if alter_statements:
                alter_query = f"ALTER TABLE bookmarks {', '.join(alter_statements)}"
                cursor.execute(alter_query)
                
            # Add foreign key constraint if folder_id was just added
            # Note: Checking for existing constraint requires querying information_schema
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM information_schema.key_column_usage 
                WHERE table_schema = 'bookstack' 
                AND table_name = 'bookmarks' 
                AND column_name = 'folder_id'
            """)
            has_fk = cursor.fetchone()['count'] > 0
            
            if not has_fk and 'folder_id' not in columns:
                cursor.execute("ALTER TABLE bookmarks ADD FOREIGN KEY (folder_id) REFERENCES folders(id)")

            # 3. Create Indexes
            print("Creating indexes...")
            # We use try/except block for indexes since MySQL doesn't have CREATE INDEX IF NOT EXISTS before 8.0 natively
            def create_index(table, column, index_name):
                try:
                    cursor.execute(f"CREATE INDEX {index_name} ON {table} ({column})")
                except pymysql.err.OperationalError as e:
                    # Duplicate key name error code is 1061
                    if e.args[0] == 1061:
                        pass
                    else:
                        raise e

            create_index('bookmarks', 'user_id', 'idx_bookmarks_user_id')
            create_index('bookmarks', 'folder_id', 'idx_bookmarks_folder_id')
            create_index('bookmarks', 'url', 'idx_bookmarks_url')
            create_index('bookmarks', 'deleted_at', 'idx_bookmarks_deleted_at')
            create_index('folders', 'user_id', 'idx_folders_user_id')
            create_index('folders', 'parent_id', 'idx_folders_parent_id')

            connection.commit()
            print("Migration successful! Collection schema is active.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        connection.close()

if __name__ == '__main__':
    migrate()
