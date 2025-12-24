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
- `POST /api/registrations` - создать заявку (**автоматически сохраняет в MongoDB и Google Sheets**)
- `POST /api/admin/sync-from-sheets` - синхронизация (требует токен)
- `GET /api/club-settings` - настройки клуба

## Google Sheets Integration 📊

Все регистрации участников автоматически сохраняются в Google Sheets таблицу для удобного просмотра и анализа.

### Быстрая настройка

1. **Установите зависимости** (уже включены в requirements.txt):

   ```bash
   pip install -r requirements.txt
   ```

2. **Настройте Google Cloud** и создайте Service Account ([подробная инструкция](../GOOGLE_SHEETS_SETUP.md))

3. **Добавьте в .env**:

   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SHEETS_CREDENTIALS_FILE=start-loft-cb70bbfaa5b7.json
   GOOGLE_SHEETS_SPREADSHEET_ID=ваш-spreadsheet-id
   ```

4. **Мигрируйте существующие данные**:
   ```bash
   python migrate_to_sheets.py --dry-run  # предпросмотр
   python migrate_to_sheets.py            # реальная миграция
   ```

### Возможности

✅ Двойное сохранение (MongoDB + Google Sheets)  
✅ Fail-safe режим (регистрация работает даже если Sheets недоступен)  
✅ Автоматическое создание заголовков  
✅ Скрипт миграции существующих данных  
✅ Простое отключение через `.env`

📖 **Документация**: [GOOGLE_SHEETS_SETUP.md](../GOOGLE_SHEETS_SETUP.md)  
🚀 **Быстрый старт**: [GOOGLE_SHEETS_QUICKSTART.md](../GOOGLE_SHEETS_QUICKSTART.md)

## Синхронизация с Google Sheets

```bash
curl -X POST http://localhost:8000/api/admin/sync-from-sheets \
  -H "Authorization: Bearer your_admin_sync_token"
```
