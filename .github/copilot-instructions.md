# Инструкции для AI-агента (Copilot)

Цель: быстро сделать AI-агента продуктивным в этом репозитории Start Loft. Кратко — что важнее всего, куда смотреть и какие шаблоны/команды использовать.

## Ключевая архитектура (Big picture)

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript. Страницы и маршруты в `frontend/app/`, переиспользуемые части в `frontend/components/`, API-клиент в `frontend/lib/api.ts`, TS-типы в `frontend/types/index.ts`.
  - Client-side рендеринг (`'use client'`) для интерактивных страниц (`frontend/app/page.tsx`)
  - Server components для статичных маршрутов (`tournaments/[slug]/page.tsx`)
- **Backend**: FastAPI (Python) + Motor (async MongoDB). Точка входа `backend/fastapi_start_loft.py` (run module). Схемы и DTO — `backend/models.py`. Подключение к MongoDB — `backend/database.py`. Конфигурация через `backend/config.py` + `.env`.
  - Lifecycle management через `@asynccontextmanager` для подключения к БД
  - SlowAPI rate limiting на критичных эндпоинтах (регистрация)
- **Данные**: MongoDB (асинхронный драйвер Motor). Коллекции: tournaments, registrations, club_settings. Slug используется для человекопонятных URL турниров.
  - `_id` конвертируется в строки при возврате из API
  - Datetime поля сериализуются через `.isoformat()`
- **API-контракт**: Pydantic-модели в `backend/models.py` — единственный источник правды. Frontend типы в `frontend/types/index.ts` должны синхронизироваться с backend моделями вручную.

## Быстрые команды (Local dev)

**Backend (FastAPI):**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # заполнить MONGODB_URI, ADMIN_TOKEN, ADMIN_SYNC_TOKEN
python fastapi_start_loft.py  # http://localhost:8000, docs: /docs
```

**Frontend (Next.js):**

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

**MongoDB (локально):**

```bash
docker run -d -p 27017:27017 --name mongo mongo:6.0
# Остановка: docker stop mongo && docker rm mongo
```

**Критичные переменные окружения (backend/.env):**

- `MONGODB_URI` — connection string (обязательно)
- `DATABASE_NAME` — имя БД (default: startloft)
- `ADMIN_TOKEN` — для защищённых admin-эндпоинтов
- `ADMIN_SYNC_TOKEN` — для синхронизации данных
- `FRONTEND_URL` — для CORS (default: http://localhost:3000)
- `HOST`, `PORT` — сервер настройки (default: 0.0.0.0:8000)

## Проектные соглашения и паттерны

- **API-первичность**: изменения в API сначала отражать в `backend/models.py` (Pydantic), затем в `frontend/types/index.ts` и `frontend/lib/api.ts`.
- **Асинхронность**: backend использует async/await + Motor; пишите асинхронные обработчики и не блокируйте event loop.
- **Rate limiting**: эндпоинт `/api/registrations` защищён `@limiter.limit("5/minute")` через SlowAPI.
- **Security**: admin-эндпоинты (POST `/api/tournaments`) требуют `X-Admin-Token` header.
- **UI**: Tailwind CSS 4.x через `tailwind.config.ts` и глобальные стили в `frontend/app/style.css`. Компоненты — функциональные React/TSX, mobile-first.
- **App Router**: маршруты в `frontend/app/` с серверными компонентами. Dynamic routes: `tournaments/[slug]/page.tsx`.
- **Naming**: Python — snake_case (функции/переменные), CamelCase (классы). TypeScript — camelCase (переменные), PascalCase (компоненты/типы).

## Важные файлы для быстрого просмотра

- `backend/fastapi_start_loft.py` — реализация эндпоинтов FastAPI (точка входа: `python fastapi_start_loft.py`).
  - Эндпоинты: `GET /api/tournaments`, `GET /api/tournaments/{slug}`, `POST /api/registrations`, `POST /api/tournaments` (admin), `GET /api/club-settings`
  - Rate limiting через SlowAPI на `/api/registrations` (5 запросов/минута)
  - CORS настроен для `localhost:3000` и `startloft.kz`
- `backend/models.py` — Pydantic-модели (источник правды для API-схем).
  - Основные модели: `Tournament`, `Registration`, `ClubSettings`, `TournamentDates`, `TournamentLocation`
  - Используется `Field(alias="_id")` для MongoDB ObjectId
- `backend/database.py` — подключение к MongoDB через Motor, singleton класс `Database`.
- `backend/config.py` — настройки через pydantic-settings из `.env`.
- `frontend/lib/api.ts` — клиент для вызовов backend; обновлять синхронно с `backend/models.py`.
  - Использует `fetch` с `cache: 'no-store'` для динамических данных
- `frontend/types/index.ts` — TypeScript интерфейсы, зеркало Pydantic моделей.
- `frontend/app/page.tsx` — главная страница с каруселью турниров и регистрацией (client component).
- `frontend/components/RegistrationForm.tsx` — форма регистрации с валидацией.
- `frontend/components/TournamentCard.tsx` — карточка турнира для списка.
- `DEPLOY.md` — инструкции по деплою через `scripts/deploy.sh`.

## Рекомендации при изменениях API или схем

1. Изменил/добавил поле в `backend/models.py` → обновить соответствующий тип в `frontend/types/`.
2. Обновить `frontend/lib/api.ts` (если меняется контракт) и проверить места использования (поиск по имени поля).
3. Запустить backend (`fastapi_start_loft.py`) и проверить `/docs` (OpenAPI) — использовать схему как источник правды.

## Отладка и проверка интеграций

- Проверка работы MongoDB: попытаться подключиться с помощью `mongosh` и просмотреть коллекции, или поднять Docker-контейнер.
- FastAPI Swagger UI: `http://localhost:8000/docs` — тестирование и документация API.
- Next.js development: `http://localhost:3000` — hot reload для UI.
- Проверка CORS: если frontend не может достучаться до API, проверьте `settings.frontend_url` в `backend/config.py` и `NEXT_PUBLIC_API_URL` в frontend.

## Deployment

Деплой на сервер выполняется через `scripts/deploy.sh`:

```bash
ssh user@server "cd /srv/startloft && ./scripts/deploy.sh"
```

Скрипт автоматически:
- Подтягивает изменения из Git
- Устанавливает Python и npm зависимости
- Собирает Next.js build (`npm run build`)
- Перезапускает сервисы (если настроены systemd)

**Критично**: настроить `.env` на сервере перед первым деплоем (см. `DEPLOY.md`).

## Что НЕ менять без проверки

- `backend/config.py` — содержит ключи окружения и параметры подключения; изменения влияют на все интеграции.
- Публичные API-эндпойнты в `backend/fastapi_start_loft.py` — синхронизируйте с фронтом и документируйте изменения в OpenAPI.

## Примеры конкретных задач и где их делать

- «Добавить новое поле tournament.type»: поменять `backend/models.py`, обновить `frontend/types/index.ts`, поправить формы в `frontend/components/RegistrationForm.tsx`, обновить загрузку/рендер в `frontend/components/TournamentCard.tsx`.
- «Исправить rate limiting»: смотреть `backend/fastapi_start_loft.py` → `@limiter.limit("5/minute")` на эндпойнте `/api/registrations`.

## Контекстные подсказки для AI-генерации кода

- Всегда сохранять API-совместимость: если добавляете поля — делайте их опциональными, пока фронт не обновлён.
- Используйте `async`/`await` в backend, избегайте блокирующих вызовов.
- При изменении UI уважайте Tailwind-классы и mobile-first подход.

Если какие-то разделы неполны или нужно добавить примеры кода — скажите, какие области приоритетнее, и я доработаю инструкцию.
