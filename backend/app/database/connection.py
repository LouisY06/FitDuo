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
    SQLModel.metadata.create_all(engine)

