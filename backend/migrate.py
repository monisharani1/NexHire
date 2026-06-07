from app.db.database import engine
from sqlalchemy import text

def run_migrations():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN breakdown JSON;"))
            print("Successfully added 'breakdown' column to 'resumes' table.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    run_migrations()
