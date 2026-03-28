from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth.dependencies import get_current_user, require_role
from database.models import User
from pydantic import BaseModel
from sqlalchemy import select

from database.db import get_db_session
from database.models import AgentState

router = APIRouter(prefix="/settings", tags=["settings"])


class AgentStateResponse(BaseModel):
    key: str
    value: str
    updated_at: datetime


class AgentStateUpdate(BaseModel):
    value: str


@router.get("/agent-state", response_model=list[AgentStateResponse])
async def get_agent_state(_: User = Depends(get_current_user)):
    async with get_db_session() as db:
        result = await db.execute(select(AgentState).order_by(AgentState.key))
        return [
            AgentStateResponse(
                key=state.key,
                value=state.value,
                updated_at=state.updated_at,
            )
            for state in result.scalars().all()
        ]


@router.get("/agent-state/{key}", response_model=AgentStateResponse)
async def get_agent_state_key(key: str, _: User = Depends(get_current_user)):
    async with get_db_session() as db:
        state = await db.get(AgentState, key)
        if not state:
            raise HTTPException(status_code=404, detail="Setting not found")
        return AgentStateResponse(
            key=state.key,
            value=state.value,
            updated_at=state.updated_at,
        )


@router.put("/agent-state/{key}", response_model=AgentStateResponse)
async def update_agent_state(key: str, body: AgentStateUpdate, _: User = Depends(require_role("MASTER"))):
    async with get_db_session() as db:
        state = await db.get(AgentState, key)
        if not state:
            state = AgentState(key=key, value=body.value)
            db.add(state)
        else:
            state.value = body.value
            state.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(state)
        return AgentStateResponse(
            key=state.key,
            value=state.value,
            updated_at=state.updated_at,
        )


@router.delete("/agent-state/{key}")
async def delete_agent_state(key: str, _: User = Depends(require_role("MASTER"))):
    async with get_db_session() as db:
        state = await db.get(AgentState, key)
        if not state:
            raise HTTPException(status_code=404, detail="Setting not found")
        await db.delete(state)
        await db.commit()
        return {"deleted": True}
