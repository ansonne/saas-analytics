from __future__ import annotations

import logging
import uuid

from sqlalchemy import select

from auth.security import hash_password
from database.db import get_db_session
from database.models import User
from utils.secrets import secrets

logger = logging.getLogger(__name__)


async def seed_master_user() -> None:
    """Create the initial MASTER user if none exists."""
    async with get_db_session() as db:
        result = await db.execute(select(User).where(User.role == "MASTER"))
        if result.scalar_one_or_none():
            return

        initial_password = str(uuid.uuid4())
        master = User(
            id=str(uuid.uuid4()),
            email=secrets.master_email,
            hashed_password=hash_password(initial_password),
            role="MASTER",
        )
        db.add(master)
        await db.commit()

    logger.warning("=== MASTER user created === email=%s ===", secrets.master_email)
    # Print to stdout only — not captured by log aggregators
    print(f"\n{'='*60}\nMASTER user created\n  email: {secrets.master_email}\n  password: {initial_password}\nSave this password now — it will not be shown again.\n{'='*60}\n", flush=True)
