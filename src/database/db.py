from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from database.models import Base
from utils.secrets import secrets


def _migrate_schema(conn) -> None:  # type: ignore[type-arg]
    """Add new columns to existing tables if they don't exist yet."""
    inspector = inspect(conn)
    msg_cols = {col["name"] for col in inspector.get_columns("chat_message")}
    if "queries_used" not in msg_cols:
        conn.execute(text("ALTER TABLE chat_message ADD COLUMN queries_used TEXT"))
    session_cols = {col["name"] for col in inspector.get_columns("chat_session")}
    if "user_id" not in session_cols:
        conn.execute(text("ALTER TABLE chat_session ADD COLUMN user_id VARCHAR(36) REFERENCES user(id) ON DELETE CASCADE"))

logger = logging.getLogger(__name__)

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _async_db_url(url: str) -> str:
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+aiomysql://", 1)
    if url.startswith("mysql+mysqlconnector://"):
        return url.replace("mysql+mysqlconnector://", "mysql+aiomysql://", 1)
    return url


async def init_db() -> None:
    global _engine, _session_factory
    database_url = secrets.database_url
    async_url = _async_db_url(database_url)
    safe_url = async_url.split("@")[-1] if "@" in async_url else async_url
    logger.info("Connecting to database: ...@%s", safe_url)
    try:
        _engine = create_async_engine(async_url, echo=False, future=True)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
        async with _engine.begin() as conn:
            logger.debug("Running create_all for schema initialisation")
            await conn.run_sync(Base.metadata.create_all)
            await conn.run_sync(_migrate_schema)
        from utils.settings import agent_settings

        await agent_settings.load()
        logger.info("Database initialised successfully")
    except Exception as exc:
        logger.critical("Failed to initialise database: %s", exc, exc_info=True)
        raise


async def close_db() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database not initialised. Call init_db() first.")
    async with _session_factory() as session:
        try:
            yield session
        except Exception as exc:
            logger.error("Database session error, rolling back: %s", exc, exc_info=True)
            await session.rollback()
            raise
