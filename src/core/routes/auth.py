from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from auth.dependencies import get_current_user, require_role
from auth.security import create_access_token, hash_password, verify_password
from database.db import get_db_session
from database.models import User

router = APIRouter(prefix="/auth", tags=["auth"])



class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class InviteRequest(BaseModel):
    email: str
    role: str = "USER"


class InviteResponse(BaseModel):
    email: str
    role: str
    initial_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateUserRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    async with get_db_session() as db:
        result = await db.execute(select(User).where(User.email == body.email.lower()))
        user = result.scalar_one_or_none()

    if not user or not user.is_active or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.role)
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    async with get_db_session() as db:
        db_user = await db.get(User, user.id)
        db_user.hashed_password = hash_password(body.new_password)
        await db.commit()
    return {"ok": True}


@router.post("/invite", response_model=InviteResponse)
async def invite_user(
    body: InviteRequest,
    _: User = Depends(require_role("ADMIN", "MASTER")),
    inviter: User = Depends(get_current_user),
):
    email = body.email.lower().strip()

    valid_roles = {"USER", "ADMIN", "MASTER"}
    role = body.role.upper()
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of {valid_roles}")

    # ADMIN cannot create MASTER users
    if inviter.role == "ADMIN" and role == "MASTER":
        raise HTTPException(status_code=403, detail="ADMINs cannot create MASTER users")

    async with get_db_session() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")

        initial_password = str(uuid.uuid4())
        new_user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hash_password(initial_password),
            role=role,
            invited_by=inviter.id,
        )
        db.add(new_user)
        await db.commit()

    return InviteResponse(email=email, role=role, initial_password=initial_password)


@router.get("/users", response_model=list[UserResponse])
async def list_users(_: User = Depends(require_role("MASTER"))):
    async with get_db_session() as db:
        result = await db.execute(select(User).order_by(User.created_at))
        return [UserResponse.model_validate(u) for u in result.scalars().all()]


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UpdateUserRequest,
    _: User = Depends(require_role("MASTER")),
):
    async with get_db_session() as db:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if body.role is not None:
            role = body.role.upper()
            if role not in {"USER", "ADMIN", "MASTER"}:
                raise HTTPException(status_code=400, detail="Role must be one of USER, ADMIN, MASTER")
            user.role = role
        if body.is_active is not None:
            user.is_active = body.is_active
        await db.commit()
        await db.refresh(user)
        return UserResponse.model_validate(user)
