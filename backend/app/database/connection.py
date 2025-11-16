from sqlmodel import SQLModel, create_engine, Session
from app.config import settings
from typing import Generator

# Use SQLite for local development/testing, PostgreSQL for production
# Railway provides DATABASE_URL automatically for PostgreSQL
if settings.database_url:
    database_url = settings.database_url
else:
    # Default to SQLite for local development
    database_url = "sqlite:///./contender.db"

engine = create_engine(database_url, echo=True)


def get_session() -> Generator[Session, None, None]:
    """Dependency for FastAPI to get database session"""
    with Session(engine) as session:
        yield session


def init_db():
    """Initialize database - create all tables"""
    try:
        # Import models here to avoid circular imports at module level
        # This ensures SQLModel knows about all tables when create_all is called
        from app.models import User, GameSession, Exercise
        from app.models.user_stats import UserStats
        
        print("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        # Don't crash the app, just log the error
        # The app can still start and tables might already exist

