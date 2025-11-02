# Backend (FastAPI + uv + Docker)

API-прокси для GigaChat. POST `/v1/request` (Basic Auth `giga/top`) поддерживает:

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
curl -u giga:top -X POST http://localhost:8000/v1/request \
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

## Ручные проверки

1. **SSE по умолчанию**

   ```bash
   curl -N -u giga:top -X POST http://localhost:8000/v1/request \
     -H "Content-Type: application/json" \
     -d '{"message":"Привет","conversation_id":"c1"}'
   ```

   Должны прийти чанки и в конце событие `[DONE]`. Повтор с тем же `conversation_id` продолжает диалог.

2. **Полный ответ**

   ```bash
   curl -u giga:top -X POST http://localhost:8000/v1/request \
     -H "Content-Type: application/json" \
     -d '{"message":"Кто такой Tauri?","stream":false,"conversation_id":"c2"}'
   ```

   Получаем `{ "content": "..." }`. Повтор с `c2` учитывает историю.

3. **Отсутствие conversation_id** — поле не передаём, сервер использует общий `default`.

4. **Два независимых диалога** — параллельно шлём в `c1` и `c2`, контекст не смешивается.

5. **Разрыв SSE** — запускаем SSE-запрос и прерываем `curl`. Следующий вызов работает без ошибок.

6. **Аутентификация** — проверяем, что без `giga/top` получаем `401`.

## Архитектура (backend)

- `src/contexts/conversation/domain` — модели для диалога.
- `src/contexts/conversation/infrastructure` — фабрика LangChain и менеджер памяти.
- `src/contexts/conversation/application` — `AgentRegistry` и `ConversationService`.
- `src/api/v1/request` — HTTP-слой, возвращающий SSE или полный ответ.

## Ссылки

- C4 model: <https://c4model.com/>
- LangChain: <https://python.langсchain.com/>
- GigaChain — обзор: <https://developers.sber.ru/docs/ru/gigachain/overview>
- GigaChat SDK (Python): <https://developers.sber.ru/docs/ru/gigachain/tools/python/gigachat>
- FastAPI: <https://fastapi.tiangolo.com/#sponsors>
- Pydantic Settings: <https://docs.pydantic.dev/latest/concepts/pydantic_settings/>
- uv: <https://docs.astral.sh/uv/>
- uv + Docker: <https://docs.astral.sh/uv/guides/integration/docker/>
