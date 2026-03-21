"""
SQLite database setup using SQLAlchemy.
Creates the engine, session factory, and base class.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import DATABASE_URL

# SQLite-specific: check_same_thread=False allows FastAPI async to work with SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False  # Set True for SQL debugging
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

def get_db():
    """
    Dependency that provides a database session to route handlers.
    Automatically closes the session when the request is done.
    Usage in routes: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables. Called on app startup."""
    Base.metadata.create_all(bind=engine)