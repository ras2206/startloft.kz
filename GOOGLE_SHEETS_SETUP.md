# Настройка интеграции с Google Sheets

## Описание

Система автоматически сохраняет регистрации участников турниров одновременно в MongoDB и Google Sheets. Это позволяет:

- Просматривать регистрации в удобном интерфейсе Google Sheets
- Легко делиться данными с организаторами
- Создавать отчеты и аналитику
- Иметь резервную копию данных

## Быстрая настройка

### Шаг 1: Создайте проект в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Google Sheets API**:
   - Перейдите в "APIs & Services" → "Enable APIs and Services"
   - Найдите "Google Sheets API" и нажмите "Enable"
4. Включите **Google Drive API** (опционально, но рекомендуется):
   - Аналогично включите "Google Drive API"

### Шаг 2: Создайте Service Account

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "Service Account"
3. Заполните данные:
   - **Service account name**: `startloft-sheets-writer`
   - **Service account ID**: автоматически
   - **Description**: "Service account для записи регистраций в Google Sheets"
4. Нажмите "Create and Continue"
5. Роль можно оставить пустой (доступ будем давать на уровне документа)
6. Нажмите "Done"

### Шаг 3: Получите JSON-ключ

1. В списке Service Accounts найдите только что созданный аккаунт
2. Нажмите на него, перейдите на вкладку "Keys"
3. Нажмите "Add Key" → "Create new key"
4. Выберите формат **JSON**
5. Скачайте файл (например, `start-loft-cb70bbfaa5b7.json`)
6. **Переместите файл в корень проекта** `/backend/` или укажите путь в `.env`

### Шаг 4: Создайте Google Sheets таблицу

1. Откройте [Google Sheets](https://sheets.google.com/)
2. Создайте новую таблицу
3. Назовите первый лист **"Регистрации"** (важно!)
4. Скопируйте **ID таблицы** из URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
5. **Предоставьте доступ Service Account**:
   - Нажмите "Share" (Поделиться)
   - Вставьте email вашего service account (из JSON-файла, поле `client_email`)
   - Выберите роль **"Editor"** (Редактор)
   - Снимите галочку "Notify people"
   - Нажмите "Share"

### Шаг 5: Настройте переменные окружения

Добавьте в файл `backend/.env`:

```env
# Google Sheets Integration
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_CREDENTIALS_FILE=start-loft-cb70bbfaa5b7.json
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
```

**Параметры:**

- `GOOGLE_SHEETS_ENABLED` - включить/выключить интеграцию (true/false)
- `GOOGLE_SHEETS_CREDENTIALS_FILE` - путь к JSON-файлу с ключами (относительно backend/)
- `GOOGLE_SHEETS_SPREADSHEET_ID` - ID таблицы из URL

### Шаг 6: Установите зависимости

```bash
cd backend
pip install -r requirements.txt
```

Будут установлены:

- `gspread==6.0.0` - библиотека для работы с Google Sheets
- `google-auth==2.26.2` - библиотека аутентификации Google

## Структура таблицы

При первой регистрации автоматически создадутся заголовки:

| ID  | Турнир ID | Название турнира | ФИО | Телефон | Категория | Звание | Город/Страна | Дата рождения | Комментарий | Статус | Дата создания | IP  | User Agent |
| --- | --------- | ---------------- | --- | ------- | --------- | ------ | ------------ | ------------- | ----------- | ------ | ------------- | --- | ---------- |
| ... | ...       | ...              | ... | ...     | ...       | ...    | ...          | ...           | ...         | ...    | ...           | ... | ...        |

## Поведение при ошибках

Интеграция работает в режиме **"fail-safe"**:

- Если Google Sheets недоступен, регистрация всё равно сохранится в MongoDB
- Ошибки записи в Sheets логируются, но не прерывают процесс
- Пользователь всегда получит успешный ответ, если данные сохранились в MongoDB

## Тестирование

После настройки протестируйте интеграцию:

```bash
cd backend
python -c "
import asyncio
from google_sheets import test_google_sheets_connection

async def test():
    result = await test_google_sheets_connection()
    print(f'Connection test: {'OK' if result else 'FAILED'}')

asyncio.run(test())
"
```

## Отключение интеграции

Для временного отключения установите в `.env`:

```env
GOOGLE_SHEETS_ENABLED=false
```

Регистрации будут сохраняться только в MongoDB.

## Безопасность

⚠️ **Важно:**

- Никогда не коммитьте JSON-файл с ключами в Git
- Добавьте `*.json` в `.gitignore` (уже добавлено)
- Храните credentials в безопасном месте
- На production используйте secrets manager (например, Vault)

## Миграция существующих данных

Если нужно перенести существующие регистрации из MongoDB в Sheets, создайте скрипт:

```python
# backend/migrate_to_sheets.py
import asyncio
from database import Database, get_registrations_collection, get_tournaments_collection
from google_sheets import append_registration_to_sheet
from bson import ObjectId

async def migrate():
    await Database.connect()
    registrations = await get_registrations_collection()
    tournaments = await get_tournaments_collection()

    async for reg in registrations.find():
        tournament = await tournaments.find_one({"_id": ObjectId(reg["tournament_id"])})
        reg["_id"] = str(reg["_id"])

        success = await append_registration_to_sheet(
            registration_data=reg,
            tournament_name=tournament.get("title") if tournament else None
        )

        print(f"{'✓' if success else '✗'} {reg.get('fio')}")

    await Database.disconnect()

asyncio.run(migrate())
```

Запуск:

```bash
python backend/migrate_to_sheets.py
```

## Возможные проблемы и решения

### Ошибка: "Credentials file not found"

- Проверьте путь к JSON-файлу в `.env`
- Убедитесь, что файл находится в директории `backend/`

### Ошибка: "Spreadsheet not found"

- Проверьте правильность SPREADSHEET_ID
- Убедитесь, что service account имеет доступ к таблице

### Ошибка: "API quota exceeded"

- Google Sheets API имеет лимиты (100 запросов в 100 секунд на пользователя)
- При массовой миграции добавьте задержки между запросами

### Регистрации не появляются в Sheets

- Проверьте логи сервера на ошибки
- Убедитесь, что `GOOGLE_SHEETS_ENABLED=true`
- Проверьте права доступа service account

## Дополнительная информация

- [gspread документация](https://docs.gspread.org/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
