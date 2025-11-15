from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import init_db
from app.routers import exercise, match, websocket, llm, auth, player, matchmaking
import os
import logging

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    
    # Log registered matchmaking routes
    logger.info(f"✅ Matchmaking router registered with prefix: {matchmaking.router.prefix}")
    matchmaking_routes = [r.path for r in matchmaking.router.routes if hasattr(r, 'path')]
    logger.info(f"✅ Matchmaking routes: {matchmaking_routes}")


# Include routers
app.include_router(exercise.router)
app.include_router(match.router)
app.include_router(websocket.router)
app.include_router(llm.router)
app.include_router(auth.router)
app.include_router(player.router)
app.include_router(matchmaking.router)

logger = logging.getLogger(__name__)


@app.get("/")
async def root():
    return {
        "message": settings.api_title,
        "status": "running",
        "version": settings.api_version,
        "environment": settings.environment,
    }

@app.get("/debug/cors")
async def debug_cors():
    """Debug endpoint to check CORS configuration"""
    return {
        "cors_origins": settings.cors_origins_list,
        "cors_origins_count": len(settings.cors_origins_list),
        "cors_origins_raw": settings.cors_origins,
        "environment": settings.environment,
        "cors_origins_env": os.getenv("CORS_ORIGINS", "NOT SET"),
    }


@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else ["N/A"],
                "name": getattr(route, "name", "unknown"),
            })
    return {
        "total_routes": len(routes),
        "routes": routes,
        "matchmaking_routes": [r for r in routes if "matchmaking" in r["path"]],
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/config")
async def get_config():
    """Endpoint to verify configuration is loaded (development only)"""
    if settings.environment == "development":
        return {
            "environment": settings.environment,
            "cors_origins": settings.cors_origins,
            "database_configured": settings.database_url is not None,
            "openrouter_configured": settings.openrouter_api_key is not None,
        }
    return {"message": "Configuration endpoint disabled in production"}


@app.get("/db/test")
async def test_database():
    """Test endpoint to verify database connection and models work"""
    from app.database.connection import get_session
    from app.models import User, Exercise, GameSession
    from sqlmodel import select
    
    try:
        session = next(get_session())
        
        # Test: Count existing records
        user_count = len(session.exec(select(User)).all())
        exercise_count = len(session.exec(select(Exercise)).all())
        game_count = len(session.exec(select(GameSession)).all())
        
        # Test: Create a test exercise (if none exist)
        if exercise_count == 0:
            test_exercise = Exercise(
                name="Push-up",
                category="push",
                description="Standard push-up",
                is_static_hold=False
            )
            session.add(test_exercise)
            session.commit()
            session.refresh(test_exercise)
            exercise_id = test_exercise.id
        else:
            exercise_id = None
        
        return {
            "status": "success",
            "database_connected": True,
            "tables_created": True,
            "counts": {
                "users": user_count,
                "exercises": exercise_count,
                "game_sessions": game_count,
            },
            "test_exercise_created": exercise_id is not None,
            "test_exercise_id": exercise_id,
        }
    except Exception as e:
        return {
            "status": "error",
            "database_connected": False,
            "error": str(e),
        }

