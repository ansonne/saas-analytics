from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

CANVAS_BLOCK = """~~~canvas
{"components":[{"type":"BarChart","props":{"title":"Receita por Plano (Últimos 6 Meses)","bars":[{"name":"Plano Mensal","data":[{"date":"2025-10","value":38400},{"date":"2025-11","value":41200},{"date":"2025-12","value":43800},{"date":"2026-01","value":39600},{"date":"2026-02","value":44100},{"date":"2026-03","value":46500}]},{"name":"Plano Anual","data":[{"date":"2025-10","value":18200},{"date":"2025-11","value":19600},{"date":"2025-12","value":21000},{"date":"2026-01","value":20400},{"date":"2026-02","value":22300},{"date":"2026-03","value":23800}]}]}}]}
~~~"""

COMPLEX_TABLE = """Aqui estão os **10 maiores clientes** por receita acumulada nos últimos 12 meses na plataforma ServicePay:

| # | Cliente | Plano | Receita (R$) | Faturas Pagas | Status |
|---|---------|-------|-------------|---------------|--------|
| 1 | Condomínio Edifício Solar | Anual | R$ 14.400 | 12 | Ativo |
| 2 | Residencial Vista Verde | Anual | R$ 13.200 | 12 | Ativo |
| 3 | Condomínio Parque das Flores | Anual | R$ 12.800 | 12 | Ativo |
| 4 | Edifício Monte Azul | Anual | R$ 12.000 | 11 | Ativo |
| 5 | Residencial Bela Aurora | Mensal | R$ 11.400 | 12 | Ativo |
| 6 | Condomínio Jardim Imperial | Anual | R$ 10.800 | 12 | Ativo |
| 7 | Edifício Horizonte | Mensal | R$ 10.200 | 11 | Ativo |
| 8 | Residencial Alto da Serra | Anual | R$ 9.600 | 12 | Ativo |
| 9 | Condomínio Rio Bonito | Mensal | R$ 9.000 | 10 | Ativo |
| 10 | Edifício Primavera | Mensal | R$ 8.400 | 12 | Ativo |

**Total acumulado (top 10):** R$ 111.800

"""

SIMPLE_ANSWERS = {
    "clientes": (
        "Atualmente temos **487 clientes ativos** na plataforma ServicePay. "
        "Em comparação ao mês passado, isso representa um crescimento de **+12%**. "
        "A maioria dos clientes está no plano mensal (73%), seguido do plano anual (27%)."
    ),
    "assinaturas": (
        "Temos atualmente **2.043 assinaturas ativas** na plataforma ServicePay. "
        "O volume cresceu **+8%** em relação ao mês anterior. "
        "Das assinaturas ativas, 1.492 são plano mensal e 551 são plano anual."
    ),
    "faturas": (
        "Nos últimos 30 dias foram geradas **5.218 faturas** na plataforma ServicePay. "
        "Desse total, **4.631 (88,7%)** foram pagas com sucesso, "
        "**412 (7,9%)** estão pendentes e **175 (3,4%)** falharam no processamento."
    ),
    "pagamentos": (
        "A taxa de sucesso de pagamentos nos últimos 30 dias é de **91,3%**. "
        "Foram processados **4.987 pagamentos**, sendo **4.553 aprovados** e **434 recusados**. "
        "O principal motivo de recusa é saldo insuficiente (62% dos casos)."
    ),
    "receita": (
        "A receita total do mês atual (março/2026) é de **R$ 70.300**. "
        "Isso representa um crescimento de **+5,2%** em relação ao mês anterior. "
        "Plano mensal contribui com R$ 46.500 (66%) e plano anual com R$ 23.800 (34%)."
    ),
}

DEFAULT_RESPONSE = (
    "Olá! Sou o assistente de analytics da plataforma **ServicePay**. "
    "Posso ajudá-lo a analisar dados de clientes, assinaturas, faturas, pagamentos e receita. "
    "Alguns exemplos do que você pode perguntar:\n\n"
    "- *Quantos clientes ativos temos?*\n"
    "- *Qual o faturamento do mês?*\n"
    "- *Mostre os maiores clientes por receita*\n"
    "- *Como está a taxa de sucesso de pagamentos?*\n\n"
    "Como posso ajudá-lo hoje?"
)

_SIMPLE_KEYWORDS = {
    "quantos", "clientes ativos", "active", "how many", "total",
    "assinaturas", "faturas", "pagamentos", "receita", "clientes",
}

_COMPLEX_KEYWORDS = {
    "tabela", "maiores", "faturamento", "top", "revenue", "breakdown",
    "ranking", "lista", "detalhe", "detalhar",
}


def _detect_mode(question: str) -> str:
    q = question.lower()
    if any(kw in q for kw in _COMPLEX_KEYWORDS):
        return "complex"
    if any(kw in q for kw in _SIMPLE_KEYWORDS):
        return "simple"
    return "default"


def _pick_simple_answer(question: str) -> str:
    q = question.lower()
    for key, answer in SIMPLE_ANSWERS.items():
        if key in q:
            return answer
    return SIMPLE_ANSWERS["clientes"]


@dataclass
class AnswerResult:
    answer: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float | None = None
    tools_used: list[str] = field(default_factory=list)
    queries_used: list[str] = field(default_factory=list)


class QuestionAnswerer:
    """Mock QuestionAnswerer for the ServicePay public demo.

    Returns pre-defined, realistic-looking answers without any external
    database connections or LLM calls.
    """

    def __init__(self) -> None:
        pass

    async def answer_question(
        self,
        question: str,
        conversation_history: list[dict] | None = None,
        on_tool_call: Callable[[str], Awaitable[None]] | None = None,
    ) -> AnswerResult:
        mode = _detect_mode(question)
        if mode == "complex":
            answer = COMPLEX_TABLE + "\n" + CANVAS_BLOCK
        elif mode == "simple":
            answer = _pick_simple_answer(question)
        else:
            answer = DEFAULT_RESPONSE

        return AnswerResult(
            answer=answer,
            input_tokens=0,
            output_tokens=0,
            cost_usd=None,
            tools_used=["ServicePay Mock"],
            queries_used=[],
        )

    async def stream_answer(
        self,
        question: str,
        conversation_history: list[dict] | None = None,
        on_tool_call: Callable[[str], Awaitable[None]] | None = None,
    ) -> AsyncGenerator[tuple[str, AnswerResult | None], None]:
        mode = _detect_mode(question)
        if mode == "complex":
            full_text = COMPLEX_TABLE + "\n" + CANVAS_BLOCK
        elif mode == "simple":
            full_text = _pick_simple_answer(question)
        else:
            full_text = DEFAULT_RESPONSE

        # Stream word by word
        words = full_text.split(" ")
        streamed = ""
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            streamed += chunk
            yield chunk, None
            await asyncio.sleep(0.01)

        yield "", AnswerResult(
            answer=streamed,
            input_tokens=0,
            output_tokens=0,
            cost_usd=None,
            tools_used=["ServicePay Mock"],
            queries_used=[],
        )
