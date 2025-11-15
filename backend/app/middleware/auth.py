from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin (if credentials provided)
firebase_app = None
if settings.firebase_credentials:
    try:
        cred = credentials.Certificate(settings.firebase_credentials)
        firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized successfully")
    except Exception as e:
        logger.warning(f"Firebase Admin initialization failed: {e}")
elif settings.environment == "development":
    # For development, allow bypassing auth if Firebase not configured
    logger.warning("Firebase credentials not configured - auth will be bypassed in development")

security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """
    Verify Firebase ID token and return decoded token.
    Returns None if auth is disabled (development mode without Firebase).
    """
    # If Firebase not configured and in development, allow bypass
    if not firebase_app and settings.environment == "development":
        logger.debug("Firebase not configured - bypassing auth in development")
        return None
    
    if not firebase_app:
        raise HTTPException(
            status_code=503,
            detail="Authentication service not configured"
        )
    
    # Get token from Authorization header or Bearer token
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")


async def get_current_user(
    token_data: Optional[dict] = Depends(verify_firebase_token),
) -> Optional[dict]:
    """
    Get current user from Firebase token.
    Returns user data or None if auth is bypassed.
    """
    if token_data is None:
        # Development mode - return mock user
        return {
            "uid": "dev_user_123",
            "email": "dev@example.com",
        }
    
    return {
        "uid": token_data.get("uid"),
        "email": token_data.get("email"),
        "name": token_data.get("name"),
    }


async def require_auth(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that requires authentication.
    Raises 401 if user is not authenticated.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user

