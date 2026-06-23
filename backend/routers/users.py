from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import User
from auth import require_roles, hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    country_code: Optional[str] = None
    subregion: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    country_code: Optional[str] = None
    subregion: Optional[str] = None
    is_active: Optional[int] = None


class PasswordReset(BaseModel):
    new_password: str


def _serialize(u: User) -> dict:
    return {
        "id":           u.id,
        "username":     u.username,
        "email":        u.email,
        "full_name":    u.full_name,
        "role":         u.role,
        "country_code": u.country_code,
        "subregion":    u.subregion,
        "is_active":    u.is_active,
    }


@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    users = db.query(User).order_by(User.role, User.full_name).all()
    return [_serialize(u) for u in users]


@router.post("/", status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    if db.query(User).filter(User.username == data.username.strip().lower()).first():
        raise HTTPException(400, "Username already exists")
    if db.query(User).filter(User.email == data.email.strip().lower()).first():
        raise HTTPException(400, "Email already exists")

    user = User(
        username=data.username.strip().lower(),
        email=data.email.strip().lower(),
        full_name=data.full_name.strip(),
        role=data.role,
        country_code=data.country_code or None,
        subregion=data.subregion or None,
        hashed_password=hash_password(data.password),
        is_active=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize(user)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    return _serialize(user)


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    data: PasswordReset,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not data.new_password or len(data.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"ok": True}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == current_user.id:
        raise HTTPException(400, "You cannot delete your own account")
    db.delete(user)
    db.commit()
    return {"ok": True}
