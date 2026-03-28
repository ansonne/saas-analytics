.PHONY: format lint check dashboard run

format:
	uv run black src/
	uv run isort src/

lint:
	uv run ruff check src/

check: format lint

dashboard:
	cd dashboard && npm run dev &
	PYTHONPATH=src uv run python -m core

run:
	PYTHONPATH=src uv run python -m core
