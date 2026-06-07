from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,           # 20 connections in pool
        max_overflow=30,        # 30 extra connections under load
        pool_pre_ping=True,     # verify connections before use
        pool_recycle=3600,      # recycle connections every hour
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency: yields DB session, closes after request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
