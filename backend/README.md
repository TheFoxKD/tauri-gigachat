# Backend (FastAPI + uv + Docker)

API-прокси для GigaChat. POST `/api/v1/request` (Basic Auth `giga/top`) поддерживает:

- потоковый ответ (SSE) по умолчанию;
- полный ответ одним JSON при `"stream": false`;
- память диалога через поле `conversation_id`.

## Требования

- uv (Python проект/менеджер): <https://docs.astral.sh/uv/>
- Docker (опционально)

## Подготовка окружения

1. Скопируйте пример и заполните при необходимости (для будущей интеграции с GigaChat):

```bash
cp .env.example .env
```

2. Установите зависимости проекта:

```bash
uv sync
```

## Локальный запуск (dev)

```bash
uv run fastapi dev src/main.py
```

Проверка:

Документация (Swagger): <http://localhost:8000/docs>

Проверочный запрос (Basic Auth `giga/top`):

```bash
curl -u giga:top -X POST http://localhost:8000/api/v1/request \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет", "stream": false}'
```

## Запуск в Docker

Сборка образа:

```bash
docker build -t gigachat-backend .
```

Запуск:

```bash
docker run --rm --name gigachat-backend \
  -p 8000:8000 \
  --env-file .env \
  -e PYTHONPATH=/app/src \
  -v "$(pwd)/src":/app/src:ro \
  gigachat-backend
```

## Структура

```text
backend/
├─ src/
│  ├─ main.py
│  ├─ api/
│  ├─ contexts/
│  │  └─ conversation/  # предметная область LangChain + память
│  ├─ core/
│  └─ ...
├─ .env.example      # пример переменных окружения GIGACHAT_*
├─ Dockerfile        # образ на базе ghcr.io/astral-sh/uv:python3.12
├─ pyproject.toml    # зависимости проекта
├─ uv.lock           # lock-файл (генерируется uv lock)
└─ .gitignore
```
