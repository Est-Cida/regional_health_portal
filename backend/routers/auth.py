from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import User
from auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


def _user_dict(u: User) -> dict:
    return {
        "username":     u.username,
        "full_name":    u.full_name,
        "email":        u.email,
        "role":         u.role,
        "country_code": u.country_code,
        "subregion":    u.subregion,
    }


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username.strip().lower()).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


# ── Profile self-service ───────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: str
    email: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.full_name.strip():
        raise HTTPException(400, "Full name cannot be empty")
    new_email = data.email.strip().lower()
    if new_email != current_user.email:
        clash = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if clash:
            raise HTTPException(400, "Email address is already in use")
    current_user.full_name = data.full_name.strip()
    current_user.email     = new_email
    db.commit()
    return _user_dict(current_user)


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"ok": True}
