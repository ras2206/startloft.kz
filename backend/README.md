# Backend для Start Loft

## Быстрый старт

### 1. Установка зависимостей

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Настройка .env

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
nano .env
```

### 4. Настройка MongoDB

1. Создайте кластер на MongoDB Atlas
2. Создайте пользователя БД
3. Разрешите доступ с вашего IP
4. Скопируйте connection string в MONGODB_URI

### 5. Запуск

```bash
python fastapi_start_loft.py
```

API будет доступен на `http://localhost:8000`

Документация: `http://localhost:8000/docs`

## API Эндпоинты

- `GET /api/tournaments` - список турниров
- `GET /api/tournaments/{slug}` - турнир по slug
- `POST /api/registrations` - создать заявку
- `POST /api/admin/sync-from-sheets` - синхронизация (требует токен)
- `GET /api/club-settings` - настройки клуба

## Синхронизация с Google Sheets

```bash
curl -X POST http://localhost:8000/api/admin/sync-from-sheets \
  -H "Authorization: Bearer your_admin_sync_token"
```
