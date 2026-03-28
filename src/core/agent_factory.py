from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from agno.agent import Agent, RunOutput
from agno.models.openrouter import OpenRouter

from utils.secrets import secrets
from utils.settings import agent_settings

logger = logging.getLogger(__name__)


def make_agent(
    tools: list,
    system: str,
    on_tool_call: Callable[[str, dict], Awaitable[None]] | None = None,
    model: str | None = None,
    max_tokens: int = 16384,
) -> Agent:
    tool_hooks = None
    if on_tool_call:

        async def _tool_hook(name: str, function: Callable, args: dict, **_: Any) -> Any:
            logger.info("Tool call started: %s", name)
            await on_tool_call(name, args)
            result = function(**args)
            if asyncio.iscoroutine(result):
                result = await result
            return result

        tool_hooks = [_tool_hook]

    model_id = model or agent_settings.default_model
    return Agent(
        model=OpenRouter(
            id=model_id,
            models=[model_id],
            api_key=secrets.llm_api_key,
            max_tokens=max_tokens,
        ),
        tools=tools,
        instructions=system,
        markdown=True,
        tool_call_limit=agent_settings.mcp_tool_call_limit,
        tool_hooks=tool_hooks,
        store_events=True,
    )


def extract_used_tokens(response: RunOutput) -> tuple[int, int]:
    if response.metrics is None:
        return 0, 0
    inp, out = response.metrics.input_tokens, response.metrics.output_tokens
    logger.info("Tokens extracted - input: %d, output: %d", inp, out)
    return inp, out
