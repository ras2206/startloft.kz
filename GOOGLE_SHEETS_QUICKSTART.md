# Быстрый старт: Google Sheets интеграция

## 1️⃣ Установите зависимости

```bash
cd backend
pip install -r requirements.txt
```

## 2️⃣ Настройте Google Cloud

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Google Sheets API
3. Создайте Service Account
4. Скачайте JSON-ключ → положите в `backend/`

## 3️⃣ Настройте Google Sheets таблицу

1. Создайте новую таблицу на [Google Sheets](https://sheets.google.com/)
2. Назовите первый лист **"Регистрации"**
3. Скопируйте ID из URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`
4. Нажмите "Share" → добавьте email из JSON (`client_email`) как Editor

## 4️⃣ Обновите .env

```bash
# В backend/.env добавьте:
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_CREDENTIALS_FILE=start-loft-cb70bbfaa5b7.json
GOOGLE_SHEETS_SPREADSHEET_ID=ваш-id-таблицы
```

## 5️⃣ Тестирование

```bash
cd backend

# Тест подключения
python -c "
import asyncio
from google_sheets import test_google_sheets_connection
asyncio.run(test_google_sheets_connection())
"

# Миграция существующих данных (dry-run)
python migrate_to_sheets.py --dry-run

# Реальная миграция
python migrate_to_sheets.py
```

## 6️⃣ Запустите сервер

```bash
python fastapi_start_loft.py
```

Теперь все новые регистрации будут автоматически сохраняться в Google Sheets! ✅

---

📖 **Подробная документация:** [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
