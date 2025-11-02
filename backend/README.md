# Backend (FastAPI + uv + Docker)

Минимальное FastAPI-приложение (`/health`). Дальше по шагам добавим проксирование в GigaChat.

## Требования
- uv (Python проект/менеджер): https://docs.astral.sh/uv/
- Docker (опционально)

## Подготовка окружения
1) Скопируйте пример и заполните при необходимости (для будущей интеграции с GigaChat):
```
cp .env.example .env
```
2) Установите зависимости проекта:
```
uv sync
```

## Локальный запуск (dev)

```bash
uv run fastapi dev src/main.py
```

Проверка:

```bash
curl http://localhost:8000/health
# {"status":"ok"}

```
Документация (Swagger):
- http://localhost:8000/docs

## Запуск в Docker

Сборка образа:

```
docker build -t gigachat-backend .
```
Запуск:

```
docker run --rm --name gigachat-backend \
  -p 8000:8000 \
  --env-file .env \
  -e PYTHONPATH=/app/src \
  -v ./src:/app/src:ro \
  gigachat-backend
```

Проверка:

```
curl http://localhost:8000/health
```

## Структура

```
backend/
├─ src/
│  └─ main.py        # минимальный FastAPI: app + /health
├─ .env.example      # пример переменных окружения GIGACHAT_*
├─ Dockerfile        # образ на базе ghcr.io/astral-sh/uv:python3.12
├─ pyproject.toml    # зависимости проекта
├─ uv.lock           # lock-файл (генерируется uv lock)
└─ .gitignore
```


## Ссылки
- GigaChain — обзор: https://developers.sber.ru/docs/ru/gigachain/overview
- GigaChat SDK (Python): https://developers.sber.ru/docs/ru/gigachain/tools/python/gigachat
- FastAPI: https://fastapi.tiangolo.com/#sponsors
- Pydantic Settings: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
- uv: https://docs.astral.sh/uv/
- uv + Docker: https://docs.astral.sh/uv/guides/integration/docker/
