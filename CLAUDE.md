# CLAUDE.md

## Project Overview

**ServicePay Analytics** is a public demo of a SaaS product analytics platform. It showcases:

- **Dashboard**: Analytics view showing customer activity, invoices, subscriptions, and payments
- **AI Chat**: Natural language interface for querying ServicePay data (mock responses, no real DB)

This is a standalone demo project — all data is mocked. No external database connections are required.

## Architecture

Single unified service:
- FastAPI backend serving API + static files
- React/Vite frontend with TailwindCSS
- Mock data layer replacing real DB connections (see `src/tools/condopay_mysql.py` and routes)
- Mock AI chat with streaming responses (see `src/chat/answerer.py`)

## Commands

```bash
# Install dependencies
uv sync

# Run backend (port 8000)
PYTHONPATH=src uv run python -m core

# Run frontend dev server (port 5173, proxies to backend)
cd dashboard && npm install && npm run dev

# Run both (backend + frontend)
make dashboard

# Format code
make check
```

## Project Structure

```
src/
├── core/           # FastAPI app and routes
│   ├── routes/     # API endpoints (chat, overview, metrics, settings)
│   ├── runner.py   # FastAPI app with lifespan
│   └── main.py     # Entry point
├── chat/           # AI chat components
│   ├── answerer.py # MockQuestionAnswerer with streaming (no real LLM)
│   └── schemas.py  # Chat message models
├── database/       # SQLAlchemy models (ChatSession, ChatMessage, AgentState)
├── tools/          # Mock MCP tools (condopay_mysql.py returns fake data)
├── prompts/        # System and answer prompts
└── utils/          # Settings, secrets, prompt loader

dashboard/          # React frontend
├── src/
│   ├── components/ # Layout, Sidebar, ChatSidebar, etc.
│   ├── pages/      # Overview, Activity, Invoices, Subscriptions, Settings
│   ├── hooks/      # useApi, useStreamingChat
│   └── api/        # Types and client utilities
```

## Key Patterns

- **Single service**: No background workers, user-initiated only
- **Mock data**: All analytics data is generated with deterministic random seeds (no real DB)
- **Portuguese responses**: Chat always responds in Portuguese (BR)
- **Streaming chat**: SSE-based streaming for real-time responses
- **DB-driven settings**: AgentState table stores runtime configuration (uses SQLite)

## Mock Data Tables (ServicePay schema)

- `audit_log` - Customer activity (LOGIN_*, SUBSCRIPTION_*, PAYMENT_*, CARD_*, INVOICE_*)
- `customer` - Customer records (~487 mock customers)
- `invoice` - Invoice status and amounts (~5000 mock invoices)
- `subscription` - Recurring payment subscriptions (~2000 mock subscriptions)
- `subscription_payment` - Payment records

## Environment Variables

Only these are required to run the demo:

```
LLM_API_KEY=demo-not-needed   # Not used in mock mode
DATABASE_URL=sqlite+aiosqlite:///./demo.db
JWT_SECRET=demo-secret-for-local-dev
MASTER_EMAIL=admin@demo.com
```

See `.env.example` for a template.
