from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth.dependencies import get_current_user
from database.models import User
from sqlalchemy import func, select, update as sql_update
from sse_starlette.sse import EventSourceResponse

from chat.answerer import QuestionAnswerer
from chat.schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionWithMessages,
)
from database.db import get_db_session
from database.models import ChatMessage, ChatSession

router = APIRouter(prefix="/chat", tags=["chat"])

_answerer = QuestionAnswerer()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(body: ChatSessionCreate | None = None, current_user: User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    async with get_db_session() as db:
        session = ChatSession(
            id=session_id,
            user_id=current_user.id,
            title=body.title if body else None,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return ChatSessionResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=0,
        )


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(current_user: User = Depends(get_current_user)):
    async with get_db_session() as db:
        stmt = (
            select(
                ChatSession,
                func.count(ChatMessage.id).label("message_count"),
            )
            .outerjoin(ChatMessage, ChatSession.id == ChatMessage.session_id)
            .where(ChatSession.user_id == current_user.id)
            .group_by(ChatSession.id)
            .order_by(ChatSession.updated_at.desc())
        )
        result = await db.execute(stmt)
        sessions = []
        for row in result.all():
            session = row[0]
            count = row[1]
            sessions.append(
                ChatSessionResponse(
                    id=session.id,
                    title=session.title,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    message_count=count,
                )
            )
        return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    async with get_db_session() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found")

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        result = await db.execute(stmt)
        messages = [
            ChatMessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
                input_tokens=msg.input_tokens,
                output_tokens=msg.output_tokens,
                cost_usd=msg.cost_usd,
                tools_used=msg.tools_used,
                queries_used=msg.queries_used,
            )
            for msg in result.scalars().all()
        ]
        return ChatSessionWithMessages(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            messages=messages,
        )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: User = Depends(get_current_user)):
    async with get_db_session() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found")
        await db.delete(session)
        await db.commit()
        return {"deleted": True}


@router.post("/sessions/{session_id}/stream")
async def stream_message(session_id: str, body: ChatMessageCreate, current_user: User = Depends(get_current_user)):
    logger = logging.getLogger(__name__)

    async def event_generator():
        async with get_db_session() as db:
            session = await db.get(ChatSession, session_id)
            if not session or session.user_id != current_user.id:
                yield {"event": "error", "data": json.dumps({"error": "Session not found"})}
                return

            user_message = ChatMessage(
                session_id=session_id,
                role="user",
                content=body.content,
            )
            db.add(user_message)
            await db.commit()

            stmt = (
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at)
            )
            result = await db.execute(stmt)
            messages = result.scalars().all()

            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages[:-1]
            ]

            new_title: str | None = None
            if not session.title and len(messages) == 1:
                new_title = body.content[:50] + ("..." if len(body.content) > 50 else "")

            full_answer = ""
            final_result = None

            async def on_tool_call(name: str, _args: dict):
                yield {"event": "tool", "data": json.dumps({"tool": name})}

            try:
                async for chunk, result in _answerer.stream_answer(
                    body.content,
                    conversation_history,
                ):
                    if chunk:
                        full_answer += chunk
                        yield {"event": "chunk", "data": json.dumps({"content": chunk})}
                    if result:
                        final_result = result
            except Exception as exc:
                logger.error("Error during stream: %s", exc, exc_info=True)
                yield {"event": "error", "data": json.dumps({"error": "An error occurred while processing your request."})}
                return

            if final_result:
                cost = final_result.cost_usd
                logger.info("Saving message cost_usd=%s", cost)

                assistant_message = ChatMessage(
                    session_id=session_id,
                    role="assistant",
                    content=final_result.answer or full_answer,
                    input_tokens=final_result.input_tokens,
                    output_tokens=final_result.output_tokens,
                    cost_usd=cost,
                    tools_used=",".join(final_result.tools_used),
                    queries_used=json.dumps(final_result.queries_used) if final_result.queries_used else None,
                )
                db.add(assistant_message)
                session_updates: dict = {"updated_at": datetime.now(timezone.utc)}
                if new_title:
                    session_updates["title"] = new_title
                await db.execute(
                    sql_update(ChatSession)
                    .where(ChatSession.id == session_id)
                    .values(**session_updates)
                    .execution_options(synchronize_session=False)
                )
                await db.commit()

                yield {
                    "event": "done",
                    "data": json.dumps(
                        {
                            "message_id": assistant_message.id,
                            "input_tokens": final_result.input_tokens,
                            "output_tokens": final_result.output_tokens,
                            "cost_usd": cost,
                            "tools_used": final_result.tools_used,
                            "queries_used": final_result.queries_used,
                        }
                    ),
                }

    return EventSourceResponse(event_generator())


@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
async def send_message(session_id: str, body: ChatMessageCreate, current_user: User = Depends(get_current_user)):
    async with get_db_session() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found")

        user_message = ChatMessage(
            session_id=session_id,
            role="user",
            content=body.content,
        )
        db.add(user_message)
        await db.commit()

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        result = await db.execute(stmt)
        messages = result.scalars().all()

        conversation_history = [{"role": msg.role, "content": msg.content} for msg in messages[:-1]]

        if not session.title and len(messages) == 1:
            title = body.content[:50] + ("..." if len(body.content) > 50 else "")
            session.title = title

        answer_result = await _answerer.answer_question(body.content, conversation_history)

        cost = answer_result.cost_usd

        assistant_message = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer_result.answer,
            input_tokens=answer_result.input_tokens,
            output_tokens=answer_result.output_tokens,
            cost_usd=cost,
            tools_used=",".join(answer_result.tools_used),
            queries_used=json.dumps(answer_result.queries_used) if answer_result.queries_used else None,
        )
        db.add(assistant_message)
        session.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(assistant_message)

        return ChatMessageResponse(
            id=assistant_message.id,
            session_id=assistant_message.session_id,
            role=assistant_message.role,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
            input_tokens=assistant_message.input_tokens,
            output_tokens=assistant_message.output_tokens,
            cost_usd=assistant_message.cost_usd,
            tools_used=assistant_message.tools_used,
            queries_used=assistant_message.queries_used,
        )
