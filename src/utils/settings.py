from __future__ import annotations

import logging

from sqlalchemy import select

from database.db import get_db_session
from database.models import AgentState

logger = logging.getLogger(__name__)


class AgentSettings:
    _DEFAULTS = {
        "default_model": "minimax/minimax-m2.5",
        "mcp_tool_call_limit": "20",
        "daily_budget_usd": "5.00",
    }

    def __init__(self) -> None:
        self._values: dict[str, str] = {}

    async def load(self) -> None:
        async with get_db_session() as session:
            result = await session.execute(select(AgentState))
            self._values = {row.key: row.value for row in result.scalars().all()}

            for key, default in self._DEFAULTS.items():
                if key not in self._values:
                    state = AgentState(key=key, value=default)
                    session.add(state)
                    self._values[key] = default
            await session.commit()

        logger.info("AgentSettings loaded: %d keys", len(self._values))

    @property
    def default_model(self) -> str:
        return self._values.get("default_model", "minimax/minimax-m2.5")

    @property
    def mcp_tool_call_limit(self) -> int:
        try:
            return int(self._values.get("mcp_tool_call_limit", "20"))
        except (ValueError, TypeError):
            logger.warning("Invalid mcp_tool_call_limit value, using default 20")
            return 20

    @property
    def daily_budget_usd(self) -> float:
        try:
            return float(self._values.get("daily_budget_usd", "5.00"))
        except (ValueError, TypeError):
            logger.warning("Invalid daily_budget_usd value, using default 5.00")
            return 5.00


agent_settings = AgentSettings()
