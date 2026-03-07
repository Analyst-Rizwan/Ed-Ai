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


# ===============================
# 🔒 FORGOT PASSWORD (OTP)
# ===============================
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from app.models.otp_code import OTPCode
from app.services.email_service import send_otp_email


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP and send it to the user's email."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Don't reveal whether the email exists
        return {"message": "If that email is registered, you will receive a reset code."}

    # Invalidate any existing unused OTPs for this email
    db.query(OTPCode).filter(
        OTPCode.email == body.email,
        OTPCode.used == False,
    ).update({"used": True})

    # Generate a new 6-digit OTP
    code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp = OTPCode(
        email=body.email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(otp)
    db.commit()

    # Send email (falls back to console if SMTP not configured)
    send_otp_email(body.email, code)

    return {"message": "If that email is registered, you will receive a reset code."}


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Validate an OTP code."""
    otp = db.query(OTPCode).filter(
        OTPCode.email == body.email,
        OTPCode.code == body.code,
        OTPCode.used == False,
    ).order_by(OTPCode.created_at.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP code has expired")

    return {"valid": True}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid OTP code."""
    otp = db.query(OTPCode).filter(
        OTPCode.email == body.email,
        OTPCode.code == body.code,
        OTPCode.used == False,
    ).order_by(OTPCode.created_at.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP code has expired")

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mark OTP as used
    otp.used = True

    # Update password
    user.password_hash = hash_password(body.new_password)

    db.commit()

    return {"message": "Password reset successfully. You can now login with your new password."}

