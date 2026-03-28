from __future__ import annotations

import logging
import random
from datetime import date, timedelta, datetime, timezone

from fastapi import APIRouter, Depends, Query

from auth.dependencies import get_current_user, require_role
from pydantic import BaseModel
from sqlalchemy import func, select as sa_select

from database.db import get_db_session
from database.models import ChatMessage

router = APIRouter(prefix="/metrics", tags=["metrics"])
logger = logging.getLogger(__name__)


class TimeSeriesPoint(BaseModel):
    date: str
    value: int


class ActivityMetrics(BaseModel):
    dau_series: list[TimeSeriesPoint]
    actions_breakdown: dict[str, int]
    top_actions: list[dict]


class InvoiceMetrics(BaseModel):
    created_series: list[TimeSeriesPoint]
    paid_series: list[TimeSeriesPoint]
    status_breakdown: dict[str, int]


class SubscriptionMetrics(BaseModel):
    active_series: list[TimeSeriesPoint]
    new_subscriptions_series: list[TimeSeriesPoint]
    cancellation_series: list[TimeSeriesPoint]
    status_breakdown: dict[str, int]


class PaymentMetrics(BaseModel):
    success_series: list[TimeSeriesPoint]
    failed_series: list[TimeSeriesPoint]
    success_rate_series: list[dict]


def _date_series(days: int) -> list[date]:
    today = date.today()
    return [today - timedelta(days=days - i - 1) for i in range(days)]


def _seed(d: date) -> int:
    return d.year * 10000 + d.month * 100 + d.day


@router.get("/activity", response_model=ActivityMetrics)
async def get_activity_metrics(
    days: int = Query(default=30, ge=1, le=90), _=Depends(get_current_user)
):
    series = _date_series(days)
    dau_series = []
    for d in series:
        rng = random.Random(_seed(d))
        dau_series.append(TimeSeriesPoint(date=str(d), value=rng.randint(55, 95)))

    actions_breakdown = {
        "LOGIN_SUCCEEDED": int(sum(p.value for p in dau_series) * 1.2),
        "PAYMENT_CARD_OK": int(days * 48),
        "INVOICE_VIEWED": int(days * 62),
        "SUBSCRIPTION_CREATED": int(days * 8),
        "SUBSCRIPTION_CANCELLED": int(days * 2),
        "PAYMENT_CARD_FAILED": int(days * 5),
        "CARD_UPDATED": int(days * 4),
        "LOGIN_FAILED": int(days * 3),
    }
    top_actions = [{"action": k, "count": v} for k, v in actions_breakdown.items()]

    return ActivityMetrics(
        dau_series=dau_series,
        actions_breakdown=actions_breakdown,
        top_actions=top_actions,
    )


@router.get("/invoices", response_model=InvoiceMetrics)
async def get_invoice_metrics(
    days: int = Query(default=30, ge=1, le=90), _=Depends(get_current_user)
):
    series = _date_series(days)
    created_series = []
    paid_series = []
    for d in series:
        rng = random.Random(_seed(d) + 1)
        created = rng.randint(50, 85)
        paid = rng.randint(int(created * 0.82), created)
        created_series.append(TimeSeriesPoint(date=str(d), value=created))
        paid_series.append(TimeSeriesPoint(date=str(d), value=paid))

    total_created = sum(p.value for p in created_series)
    total_paid = sum(p.value for p in paid_series)
    pending = int(total_created * 0.07)
    failed = total_created - total_paid - pending

    return InvoiceMetrics(
        created_series=created_series,
        paid_series=paid_series,
        status_breakdown={
            "PAID": total_paid,
            "PENDING": pending,
            "FAILED": max(failed, 0),
        },
    )


@router.get("/subscriptions", response_model=SubscriptionMetrics)
async def get_subscription_metrics(
    days: int = Query(default=30, ge=1, le=90), _=Depends(get_current_user)
):
    series = _date_series(days)
    new_subs = []
    cancellations = []
    active_series = []
    base_active = 1950
    for i, d in enumerate(series):
        rng = random.Random(_seed(d) + 2)
        new_count = rng.randint(3, 12)
        cancel_count = rng.randint(0, 3)
        base_active += new_count - cancel_count
        new_subs.append(TimeSeriesPoint(date=str(d), value=new_count))
        cancellations.append(TimeSeriesPoint(date=str(d), value=cancel_count))
        active_series.append(TimeSeriesPoint(date=str(d), value=base_active))

    return SubscriptionMetrics(
        active_series=active_series,
        new_subscriptions_series=new_subs,
        cancellation_series=cancellations,
        status_breakdown={
            "ACTIVE": 2043,
            "CANCELLED": 487,
            "PAST_DUE": 62,
        },
    )


@router.get("/payments", response_model=PaymentMetrics)
async def get_payment_metrics(
    days: int = Query(default=30, ge=1, le=90), _=Depends(get_current_user)
):
    series = _date_series(days)
    success_series = []
    failed_series = []
    success_rate_series = []
    for d in series:
        rng = random.Random(_seed(d) + 3)
        success = rng.randint(38, 65)
        failed = rng.randint(2, 8)
        total = success + failed
        rate = round((success / total) * 100, 1) if total > 0 else 0.0
        success_series.append(TimeSeriesPoint(date=str(d), value=success))
        failed_series.append(TimeSeriesPoint(date=str(d), value=failed))
        success_rate_series.append({"date": str(d), "rate": rate, "total": total})

    return PaymentMetrics(
        success_series=success_series,
        failed_series=failed_series,
        success_rate_series=success_rate_series,
    )


class CostDayPoint(BaseModel):
    date: str
    cost_usd: float
    input_tokens: int
    output_tokens: int
    messages: int


class CostMetrics(BaseModel):
    daily_series: list[CostDayPoint]
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    total_messages: int


@router.get("/costs", response_model=CostMetrics)
async def get_cost_metrics(
    days: int = Query(default=30, ge=1, le=90),
    _=Depends(require_role("ADMIN", "MASTER")),
):
    start_date = datetime.now(timezone.utc).date() - timedelta(days=days)
    async with get_db_session() as session:
        date_col = func.date(ChatMessage.created_at).label("date")
        result = await session.execute(
            sa_select(
                date_col,
                func.sum(ChatMessage.cost_usd).label("cost_usd"),
                func.sum(ChatMessage.input_tokens).label("input_tokens"),
                func.sum(ChatMessage.output_tokens).label("output_tokens"),
                func.count(ChatMessage.id).label("messages"),
            )
            .where(
                ChatMessage.role == "assistant",
                ChatMessage.cost_usd.isnot(None),
                ChatMessage.created_at >= start_date.isoformat(),
            )
            .group_by(func.date(ChatMessage.created_at))
            .order_by(func.date(ChatMessage.created_at))
        )
        rows = result.all()

    daily_series = [
        CostDayPoint(
            date=str(row.date),
            cost_usd=round(float(row.cost_usd or 0), 6),
            input_tokens=int(row.input_tokens or 0),
            output_tokens=int(row.output_tokens or 0),
            messages=int(row.messages or 0),
        )
        for row in rows
    ]

    return CostMetrics(
        daily_series=daily_series,
        total_cost_usd=round(sum(p.cost_usd for p in daily_series), 6),
        total_input_tokens=sum(p.input_tokens for p in daily_series),
        total_output_tokens=sum(p.output_tokens for p in daily_series),
        total_messages=sum(p.messages for p in daily_series),
    )
