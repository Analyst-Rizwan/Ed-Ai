from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.auth import service, schemas, dependencies
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.config import settings
from app.auth.utils import get_password_hash
from app.schemas.user import UserCreate, UserOut

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # 1. Create Access Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = service.create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    
    # 2. Create Refresh Token
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = service.create_refresh_token(
        data={"sub": str(user.id), "jti": str(datetime.utcnow().timestamp())}, 
        expires_delta=refresh_token_expires
    )
    
    # 3. Store Refresh Token Hash in DB
    # In a real production app, you might only allow N active refresh tokens per user
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=get_password_hash(refresh_token),
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()
    
    # 4. Set Refresh Token HTTPOnly Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # Set to True for production (HTTPS)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token using HTTPOnly cookie
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    # 1. Validate Token JWT Structure
    # (In dependencies.py or service.py, we could have a verify_token helper)
    # For now, we decode here or use a helper
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if token_type != "refresh":
             raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    # 2. Check DB for matching hash
    # We need to find valid refresh tokens for this user
    # Ideally, we iterate/search. Since we can't search by hash easily (salt), 
    # we might need to store the `jti` unhashed or search all user's tokens.
    # Architecture doc said "Stored hashed in DB". 
    # Standard practice with bcrypt: verify by iterating over user's tokens or storing a JTI/UUID.
    
    # OPTIMIZATION: Store JTI in DB if we want fast lookups.
    # Current model doesn't have JTI. We'll fetch all active tokens for user and verify.
    # (Less efficient if user has 100 sessions, but usually they have < 5)
    
    user_tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == int(user_id),
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).all()
    
    valid_db_token = None
    for token_record in user_tokens:
        if service.verify_password(refresh_token, token_record.token_hash):
            valid_db_token = token_record
            break
            
    if not valid_db_token:
        # Potential Reuse / Attack -> Revoke all?
        # For now just fail
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")
        
    # 3. Rotate Token
    # Revoke old
    valid_db_token.revoked = True
    db.add(valid_db_token)
    
    # Issue new
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    new_access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = service.create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=new_access_token_expires
    )
    
    new_refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = service.create_refresh_token(
        data={"sub": str(user.id), "jti": str(datetime.utcnow().timestamp())}, 
        expires_delta=new_refresh_token_expires
    )
    
    new_db_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=get_password_hash(new_refresh_token),
        expires_at=datetime.utcnow() + new_refresh_token_expires
    )
    db.add(new_db_refresh_token)
    db.commit()
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_user)
):
    # Revoke backend token if present
    if refresh_token:
        # Find and revoke
        # Verify overhead similar to refresh
        user_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        ).all()
        
        for token_record in user_tokens:
            if service.verify_password(refresh_token, token_record.token_hash):
                token_record.revoked = True
                db.add(token_record)
                break
        db.commit()

    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserOut)
def read_users_me(
    current_user: User = Depends(dependencies.get_current_user)
):
    return current_user

# Register endpoint (Added for completeness as user lacks it)
@router.post("/register", response_model=UserOut)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role="user"
    )
    
    # Initialize UserProgress
    from app.models.progress import UserProgress
    user_progress = UserProgress(
        user=user,
        completed_roadmaps=[],
        completed_problems=[]
    )
    
    db.add(user)
    db.add(user_progress)
    db.commit()
    db.refresh(user)
    return user
