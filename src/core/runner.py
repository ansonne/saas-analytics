from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.routes import auth, chat, metrics, overview, settings
from core.seed import seed_master_user
from database.db import close_db, init_db
from utils.secrets import secrets

logger = logging.getLogger(__name__)


def _find_static_dir() -> Path:
    current = Path(__file__).resolve().parent
    for _ in range(6):
        candidate = current / "dashboard" / "dist"
        if candidate.is_dir():
            return candidate
        current = current.parent
    return Path("/app/dashboard/dist")


_STATIC_DIR = _find_static_dir()


@asynccontextmanager
async def _lifespan(application: FastAPI):
    await init_db()
    await seed_master_user()
    logger.info("ServicePay Analytics backend started")
    yield
    await close_db()
    logger.info("ServicePay Analytics backend stopped")


app = FastAPI(title="ServicePay Analytics", lifespan=_lifespan)

_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
_configured = [o.strip() for o in secrets.allowed_origins.split(",") if o.strip()]
_ALLOWED_ORIGINS = _configured if _configured else _DEV_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

if _STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(_STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file = _STATIC_DIR / full_path
        if file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(_STATIC_DIR / "index.html"))
