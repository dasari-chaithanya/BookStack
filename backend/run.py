from app import create_app

app = create_app()

with app.app_context():
    from app.extensions import db
    try:
        db.create_all()
        print("DEBUG: Database tables checked/created successfully.")
    except Exception as e:
        print(f"ERROR: Could not connect to the database. {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)
