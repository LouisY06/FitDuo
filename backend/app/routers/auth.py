from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models import User
from app.middleware.auth import get_current_user, require_auth
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    username: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
):
    """Get or create user profile from Firebase token"""
    firebase_uid = current_user.get("uid")
    email = current_user.get("email")
    
    logger.info(f"🔍 /me request - Firebase UID: {firebase_uid}, Email: {email}")
    
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    # Find or create user
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if not user:
        # Create new user
        logger.info(f"✨ Creating NEW user - Firebase UID: {firebase_uid}, Email: {email}")
        user = User(
            firebase_uid=firebase_uid,
            username=current_user.get("name") or current_user.get("email", "User"),
            email=current_user.get("email"),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        logger.info(f"✅ Created user ID: {user.id}")
    else:
        logger.info(f"✅ Found existing user ID: {user.id} for Firebase UID: {firebase_uid}")
    
    return UserResponse(
        id=user.id,
        firebase_uid=user.firebase_uid,
        username=user.username,
        email=user.email,
    )


@router.post("/sync")
async def sync_user_profile(
    current_user: dict = Depends(require_auth),
    session: Session = Depends(get_session),
):
    """Sync user profile with Firebase data"""
    firebase_uid = current_user.get("uid")
    
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    user = session.exec(
        select(User).where(User.firebase_uid == firebase_uid)
    ).first()
    
    if user:
        # Update existing user
        if current_user.get("email"):
            user.email = current_user.get("email")
        if current_user.get("name"):
            user.username = current_user.get("name")
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        # Create new user
        user = User(
            firebase_uid=firebase_uid,
            username=current_user.get("name") or current_user.get("email", "User"),
            email=current_user.get("email"),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    return {"message": "User profile synced", "user_id": user.id}

