from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


@lru_cache(maxsize=32)
def load_prompt(name: str) -> str:
    file_path = _PROMPTS_DIR / f"{name}.md"
    if not file_path.exists():
        logger.warning("Prompt file not found: %s", file_path)
        return ""
    return file_path.read_text(encoding="utf-8")


def load_db_context() -> str:
    context_dir = _PROMPTS_DIR / "db_context"
    if not context_dir.exists():
        return ""
    parts = []
    for file in sorted(context_dir.glob("*.md")):
        parts.append(file.read_text(encoding="utf-8"))
    return "\n\n".join(parts)
