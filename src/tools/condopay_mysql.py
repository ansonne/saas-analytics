"""Mock ServicePay MCP tools for the public demo.

Returns realistic fake data — no external database connections required.
"""
from __future__ import annotations

import json
import sys
import logging
from contextlib import asynccontextmanager
from typing import Any

logger = logging.getLogger(__name__)

MOCK_TABLES = [
    "audit_log",
    "customer",
    "invoice",
    "subscription",
    "subscription_payment",
]

MOCK_SCHEMAS = {
    "customer": [
        {"Field": "id", "Type": "bigint", "Null": "NO", "Key": "PRI"},
        {"Field": "name", "Type": "varchar(255)", "Null": "NO", "Key": ""},
        {"Field": "email", "Type": "varchar(255)", "Null": "NO", "Key": "UNI"},
        {"Field": "status", "Type": "enum('ACTIVE','INACTIVE')", "Null": "NO", "Key": ""},
        {"Field": "created_at", "Type": "datetime", "Null": "NO", "Key": ""},
    ],
    "invoice": [
        {"Field": "id", "Type": "bigint", "Null": "NO", "Key": "PRI"},
        {"Field": "customer_id", "Type": "bigint", "Null": "NO", "Key": "MUL"},
        {"Field": "amount", "Type": "decimal(10,2)", "Null": "NO", "Key": ""},
        {"Field": "status", "Type": "enum('PENDING','PAID','FAILED')", "Null": "NO", "Key": ""},
        {"Field": "product_source", "Type": "varchar(50)", "Null": "NO", "Key": ""},
        {"Field": "created_at", "Type": "datetime", "Null": "NO", "Key": ""},
        {"Field": "updated_at", "Type": "datetime", "Null": "NO", "Key": ""},
    ],
    "subscription": [
        {"Field": "id", "Type": "bigint", "Null": "NO", "Key": "PRI"},
        {"Field": "customer_id", "Type": "bigint", "Null": "NO", "Key": "MUL"},
        {"Field": "plan", "Type": "enum('MONTHLY','ANNUAL')", "Null": "NO", "Key": ""},
        {"Field": "status", "Type": "enum('ACTIVE','CANCELLED','PAST_DUE')", "Null": "NO"},
        {"Field": "amount", "Type": "decimal(10,2)", "Null": "NO", "Key": ""},
        {"Field": "created_at", "Type": "datetime", "Null": "NO", "Key": ""},
    ],
    "audit_log": [
        {"Field": "id", "Type": "bigint", "Null": "NO", "Key": "PRI"},
        {"Field": "customer_id", "Type": "bigint", "Null": "YES", "Key": "MUL"},
        {"Field": "action", "Type": "varchar(100)", "Null": "NO", "Key": ""},
        {"Field": "created_at", "Type": "datetime", "Null": "NO", "Key": ""},
    ],
    "subscription_payment": [
        {"Field": "id", "Type": "bigint", "Null": "NO", "Key": "PRI"},
        {"Field": "subscription_id", "Type": "bigint", "Null": "NO", "Key": "MUL"},
        {"Field": "amount", "Type": "decimal(10,2)", "Null": "NO", "Key": ""},
        {"Field": "status", "Type": "enum('SUCCESS','FAILED')", "Null": "NO", "Key": ""},
        {"Field": "created_at", "Type": "datetime", "Null": "NO", "Key": ""},
    ],
}

MOCK_CUSTOMERS = [
    {
        "id": 1,
        "name": "Condomínio Edifício Solar",
        "email": "admin@edificiosolar.com.br",
        "status": "ACTIVE",
    },
    {
        "id": 2,
        "name": "Residencial Vista Verde",
        "email": "financeiro@vistaverde.com.br",
        "status": "ACTIVE",
    },
    {
        "id": 3,
        "name": "Condomínio Parque das Flores",
        "email": "sindico@parqueflores.com.br",
        "status": "ACTIVE",
    },
    {
        "id": 4,
        "name": "Edifício Monte Azul",
        "email": "admin@monteazul.com.br",
        "status": "ACTIVE",
    },
    {
        "id": 5,
        "name": "Residencial Bela Aurora",
        "email": "adm@belaaurora.com.br",
        "status": "ACTIVE",
    },
]


def _execute_mock_query(sql: str) -> list[dict]:
    sql_lower = sql.strip().lower()

    if "count(*)" in sql_lower and "customer" in sql_lower:
        return [{"count(*)": 487}]

    if "count(*)" in sql_lower and "subscription" in sql_lower and "active" in sql_lower:
        return [{"count(*)": 2043}]

    if "count(*)" in sql_lower and "invoice" in sql_lower:
        return [{"count(*)": 5218}]

    if "from customer" in sql_lower:
        return MOCK_CUSTOMERS[:5]

    if "from subscription" in sql_lower:
        return [
            {
                "id": 1,
                "customer_id": 1,
                "plan": "ANNUAL",
                "status": "ACTIVE",
                "amount": 1200.00,
            },
            {
                "id": 2,
                "customer_id": 2,
                "plan": "ANNUAL",
                "status": "ACTIVE",
                "amount": 1100.00,
            },
            {
                "id": 3,
                "customer_id": 3,
                "plan": "MONTHLY",
                "status": "ACTIVE",
                "amount": 950.00,
            },
        ]

    if "from invoice" in sql_lower:
        return [
            {
                "id": 1,
                "customer_id": 1,
                "amount": 1200.00,
                "status": "PAID",
                "product_source": "SERVICEPAY",
            },
            {
                "id": 2,
                "customer_id": 2,
                "amount": 1100.00,
                "status": "PAID",
                "product_source": "SERVICEPAY",
            },
            {
                "id": 3,
                "customer_id": 3,
                "amount": 950.00,
                "status": "PENDING",
                "product_source": "SERVICEPAY",
            },
        ]

    if "from audit_log" in sql_lower:
        return [
            {"action": "LOGIN_SUCCEEDED", "count": 2845},
            {"action": "PAYMENT_CARD_OK", "count": 1440},
            {"action": "INVOICE_VIEWED", "count": 1860},
            {"action": "SUBSCRIPTION_CREATED", "count": 240},
        ]

    return [{"result": "Mock query executed. No matching data pattern found."}]


class _MockMCPTools:
    """Minimal mock that satisfies the async context manager interface used by agno."""

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    # agno accesses .tools to build the tool list; return empty list for mock
    @property
    def tools(self) -> list:
        return []


@asynccontextmanager
async def make_condopay_mcp():
    """Async context manager returning a mock MCP tools object for ServicePay demo."""
    yield _MockMCPTools()
