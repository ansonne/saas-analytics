# CondoPay Analytics

Product analytics agent for CondoPay — the billing and receivables platform for condominium residents.

## Features

- **Dashboard**: Analytics views for customers, invoices, subscriptions, and activity
- **AI Chat**: Natural language interface to query CondoPay data, with streaming responses and AI-generated visualizations (canvas)
- **Cost Tracking**: LLM usage and cost monitoring
- **Auth**: JWT-based login with password management

## Architecture

Single unified service:

- **Backend**: FastAPI (Python 3.11+), served on port 8000
- **Frontend**: React + Vite + TailwindCSS, proxied to backend in dev
- **AI**: Agno agent framework with OpenRouter LLM, streamed via SSE
- **Internal DB**: SQLAlchemy + SQLite (dev) / MySQL (prod) — stores sessions, messages, settings
- **CondoPay DB**: Read-only MySQL access via MCP tool

## Pages

| Route | Description |
|---|---|
| `/` | Overview — key metrics summary |
| `/activity` | Audit log activity breakdown |
| `/invoices` | Invoice status and amounts |
| `/subscriptions` | Subscription and payment records |
| `/users` | Customer list |
| `/chat` | Full-screen AI chat interface |
| `/costs` | LLM cost tracking |
| `/settings` | Agent runtime configuration |
| `/account` | Password change |

## Setup

**Requirements**: Python 3.11+, Node 20+, [uv](https://github.com/astral-sh/uv)

```bash
# Install Python dependencies
uv sync

# Install frontend dependencies
cd dashboard && npm install
```

Create a `.env` file:

```env
LLM_API_KEY=...              # OpenRouter API key
DATABASE_URL=...             # Internal DB (e.g. sqlite+aiosqlite:///./app.db)
CONDOPAY_MYSQL_HOST=...
CONDOPAY_MYSQL_PORT=3306
CONDOPAY_MYSQL_USER=...
CONDOPAY_MYSQL_PASSWORD=...
CONDOPAY_MYSQL_DATABASE=condopay
SECRET_KEY=...               # JWT secret
```

## Running

```bash
# Backend only (port 8000)
make run

# Backend + frontend dev server (port 5173)
make dashboard
```

## Docker

```bash
docker build -t condopay-analytics .
docker run -p 8000:8000 --env-file .env condopay-analytics
```

## Development

```bash
# Format + lint
make check

# Format only
make format

# Lint only
make lint
```

## Key Constraints

- CondoPay DB is **read-only** — only `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` queries are allowed
- AI agent responds exclusively in **Portuguese (BR)**
- No background workers — all processing is user-initiated
