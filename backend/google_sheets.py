"""
Google Sheets integration for saving tournament registrations.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from functools import lru_cache

import gspread
from google.oauth2.service_account import Credentials
from gspread.exceptions import APIError, SpreadsheetNotFound

from config import settings

logger = logging.getLogger(__name__)

# Google Sheets API scopes
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]


@lru_cache(maxsize=1)
def get_google_sheets_client() -> Optional[gspread.Client]:
    """
    Создает и кэширует Google Sheets клиент.
    
    Returns:
        gspread.Client или None если интеграция отключена или credentials недоступны
    """
    if not settings.google_sheets_enabled:
        logger.info("Google Sheets integration is disabled")
        return None
    
    if not settings.google_sheets_credentials_file:
        logger.warning("Google Sheets credentials file not configured")
        return None
    
    try:
        credentials = Credentials.from_service_account_file(
            settings.google_sheets_credentials_file,
            scopes=SCOPES
        )
        client = gspread.authorize(credentials)
        logger.info("Google Sheets client initialized successfully")
        return client
    except FileNotFoundError:
        logger.error(f"Credentials file not found: {settings.google_sheets_credentials_file}")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Google Sheets client: {e}")
        return None


async def append_registration_to_sheet(
    registration_data: Dict[str, Any],
    tournament_name: Optional[str] = None
) -> bool:
    """
    Добавляет регистрацию в Google Sheets таблицу.
    Функция асинхронная, но выполняет sync операции в executor.
    
    Args:
        registration_data: Данные регистрации из MongoDB
        tournament_name: Название турнира (опционально, для удобства)
    
    Returns:
        bool: True если успешно, False если произошла ошибка
    """
    if not settings.google_sheets_enabled:
        logger.debug("Google Sheets integration disabled, skipping")
        return False
    
    if not settings.google_sheets_spreadsheet_id:
        logger.warning("Google Sheets spreadsheet ID not configured")
        return False
    
    try:
        # Выполняем sync операции в отдельном потоке чтобы не блокировать event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            _sync_append_to_sheet,
            registration_data,
            tournament_name
        )
        return result
    except Exception as e:
        logger.error(f"Failed to append registration to Google Sheets: {e}")
        return False


def _sync_append_to_sheet(
    registration_data: Dict[str, Any],
    tournament_name: Optional[str] = None
) -> bool:
    """
    Синхронная функция для добавления данных в Google Sheets.
    Вызывается через run_in_executor.
    """
    try:
        client = get_google_sheets_client()
        if not client:
            return False
        
        # Открываем таблицу
        spreadsheet = client.open_by_key(settings.google_sheets_spreadsheet_id)
        
        # Используем первый лист или лист с названием "Регистрации"
        try:
            worksheet = spreadsheet.worksheet("Регистрации")
        except Exception:
            worksheet = spreadsheet.get_worksheet(0)
        
        # Проверяем наличие заголовков (первая строка)
        headers = worksheet.row_values(1)
        if not headers or headers[0] != "ID":
            # Создаем заголовки если их нет
            headers_row = [
                "Дата создания",
                "Категория",
                "Звание",
                "Город/Страна",
                "Название турнира",
                "ФИО",
                "Телефон",
                "ID",
                "Турнир ID",
            ]
            worksheet.insert_row(headers_row, 1)
        
        # Подготавливаем данные для вставки
        meta = registration_data.get("meta", {})
        created_at = registration_data.get("created_at")
        
        # Форматируем datetime
        if isinstance(created_at, datetime):
            created_at_str = created_at.strftime("%Y-%m-%d %H:%M:%S")
        else:
            created_at_str = str(created_at) if created_at else ""
        
        row_data = [
            created_at_str,
            registration_data.get("category", ""),
            registration_data.get("rank", ""),
            registration_data.get("city_country", ""),
            tournament_name or "",
            registration_data.get("fio", ""),
            registration_data.get("phone", ""),
            str(registration_data.get("_id", "")),
            str(registration_data.get("tournament_id", ""))
        ]
        
        # Добавляем строку в конец таблицы
        worksheet.append_row(row_data, value_input_option="USER_ENTERED")
        
        logger.info(
            f"Successfully added registration to Google Sheets: "
            f"{registration_data.get('fio')} for tournament {tournament_name or registration_data.get('tournament_id')}"
        )
        return True
        
    except SpreadsheetNotFound:
        logger.error(f"Spreadsheet not found: {settings.google_sheets_spreadsheet_id}")
        return False
    except APIError as e:
        logger.error(f"Google Sheets API error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in _sync_append_to_sheet: {e}")
        return False


async def test_google_sheets_connection() -> bool:
    """
    Тестирует подключение к Google Sheets.
    
    Returns:
        bool: True если подключение успешно
    """
    try:
        client = get_google_sheets_client()
        if not client:
            return False
        
        if not settings.google_sheets_spreadsheet_id:
            logger.warning("Spreadsheet ID not configured")
            return False
        
        loop = asyncio.get_event_loop()
        spreadsheet = await loop.run_in_executor(
            None,
            client.open_by_key,
            settings.google_sheets_spreadsheet_id
        )
        
        logger.info(f"Successfully connected to spreadsheet: {spreadsheet.title}")
        return True
        
    except Exception as e:
        logger.error(f"Google Sheets connection test failed: {e}")
        return False
