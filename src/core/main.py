from __future__ import annotations

import logging
import sys


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
    )
    for noisy in ("httpx", "httpcore", "urllib3", "mcp"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    import uvicorn

    uvicorn.run(
        "core.runner:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
