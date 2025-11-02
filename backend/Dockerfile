FROM ghcr.io/astral-sh/uv:python3.13-alpine

ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock

RUN uv sync --frozen --no-dev

COPY src/ /app/src/

EXPOSE 8000

CMD ["uv", "run", "fastapi", "dev", "src/main.py", "--host", "0.0.0.0", "--port", "8000"]
