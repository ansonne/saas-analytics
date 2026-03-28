from __future__ import annotations

import logging
import random
from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user

router = APIRouter(tags=["overview"])
logger = logging.getLogger(__name__)


class OverviewStats(BaseModel):
    dau_today: int
    dau_yesterday: int
    dau_change_pct: float
    active_subscriptions: int
    invoices_created_today: int
    invoices_paid_today: int
    payment_success_rate: float
    total_customers: int


def _seed_for_day(d: date) -> int:
    return d.year * 10000 + d.month * 100 + d.day


@router.get("/overview", response_model=OverviewStats)
async def get_overview(_=Depends(get_current_user)):
    today = date.today()
    yesterday = date.fromordinal(today.toordinal() - 1)

    rng_today = random.Random(_seed_for_day(today))
    rng_yesterday = random.Random(_seed_for_day(yesterday))

    dau_today = rng_today.randint(68, 95)
    dau_yesterday = rng_yesterday.randint(68, 95)
    dau_change_pct = round(((dau_today - dau_yesterday) / dau_yesterday) * 100, 1)

    active_subscriptions = rng_today.randint(1980, 2060)
    invoices_created_today = rng_today.randint(45, 80)
    invoices_paid_today = rng_today.randint(35, invoices_created_today)
    payment_success_rate = round(rng_today.uniform(88.5, 94.5), 1)
    total_customers = rng_today.randint(482, 495)

    return OverviewStats(
        dau_today=dau_today,
        dau_yesterday=dau_yesterday,
        dau_change_pct=dau_change_pct,
        active_subscriptions=active_subscriptions,
        invoices_created_today=invoices_created_today,
        invoices_paid_today=invoices_paid_today,
        payment_success_rate=payment_success_rate,
        total_customers=total_customers,
    )
