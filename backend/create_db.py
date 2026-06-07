"""
Run this ONCE to create the nexhire database in PostgreSQL.
Usage: python create_db.py
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

HOST = "localhost"
PORT = 5432
USER = "postgres"
PASSWORD = "Pavan@2005"   # @ is fine here — we use keyword args, not URL
DB_NAME = "nexhire"

try:
    # Connect to default 'postgres' database first
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Check if database already exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
    exists = cur.fetchone()

    if exists:
        print(f"✅ Database '{DB_NAME}' already exists.")
    else:
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"✅ Database '{DB_NAME}' created successfully!")

    cur.close()
    conn.close()
    print("\n✅ PostgreSQL connection is working!")
    print(f"   Host: {HOST}:{PORT}")
    print(f"   User: {USER}")
    print(f"   Database: {DB_NAME}")
    print(f"\n👉 Update your .env:")
    print(f"   DATABASE_URL=postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}")

except psycopg2.OperationalError as e:
    print(f"❌ Could not connect to PostgreSQL:")
    print(f"   {e}")
    print("\n   Make sure PostgreSQL is running and credentials are correct.")
except Exception as e:
    print(f"❌ Error: {e}")
