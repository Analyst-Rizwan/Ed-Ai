from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ===============================
# 🚀 USER REGISTRATION
# ===============================
@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"User '{new_user.username}' registered successfully",
        "email": new_user.email,
    }


# ===============================
# 🔑 USER LOGIN
# ===============================
@router.post("/login", response_model=dict)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user or not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": db_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ===============================
# 👤 GET CURRENT USER (Protected)
# ===============================
@router.get("/me", response_model=UserOut)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
