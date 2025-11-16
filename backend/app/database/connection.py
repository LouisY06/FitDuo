from sqlmodel import SQLModel, create_engine, Session
from app.config import settings
from typing import Generator

# Import all models so SQLModel knows about them
from app.models.user import User
from app.models.exercise import Exercise
from app.models.game_session import GameSession
from app.models.user_stats import UserStats

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
    # Import models here to ensure they're registered with SQLModel
    # This is needed for SQLModel to create the tables
    SQLModel.metadata.create_all(engine)

