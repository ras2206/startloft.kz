#!/usr/bin/env python3
"""
Скрипт миграции существующих регистраций из MongoDB в Google Sheets.

Использование:
    python migrate_to_sheets.py
    
Опции:
    --dry-run    Только показать что будет мигрировано, без записи
    --limit N    Мигрировать только N записей
"""

import asyncio
import argparse
import sys
from datetime import datetime
from bson import ObjectId

from database import Database, get_registrations_collection, get_tournaments_collection
from google_sheets import append_registration_to_sheet, test_google_sheets_connection
from config import settings


async def migrate_registrations(dry_run: bool = False, limit: int = None):
    """
    Мигрирует регистрации из MongoDB в Google Sheets.
    
    Args:
        dry_run: Если True, только показывает данные без записи
        limit: Максимальное количество записей для миграции
    """
    print("=" * 60)
    print("Миграция регистраций в Google Sheets")
    print("=" * 60)
    
    # Проверяем настройки
    if not settings.google_sheets_enabled:
        print("❌ Google Sheets integration отключена в настройках")
        print("   Установите GOOGLE_SHEETS_ENABLED=true в .env")
        return
    
    if not settings.google_sheets_spreadsheet_id:
        print("❌ GOOGLE_SHEETS_SPREADSHEET_ID не настроен")
        return
    
    # Подключаемся к БД
    print("\n📊 Подключение к MongoDB...")
    await Database.connect()
    
    # Тестируем подключение к Google Sheets
    print("📊 Тестирование подключения к Google Sheets...")
    if not await test_google_sheets_connection():
        print("❌ Не удалось подключиться к Google Sheets")
        print("   Проверьте настройки credentials и spreadsheet ID")
        await Database.disconnect()
        return
    
    print("✅ Подключение успешно\n")
    
    # Получаем коллекции
    registrations_collection = await get_registrations_collection()
    tournaments_collection = await get_tournaments_collection()
    
    # Подсчитываем количество регистраций
    total_count = await registrations_collection.count_documents({})
    print(f"📈 Найдено регистраций в MongoDB: {total_count}")
    
    if total_count == 0:
        print("ℹ️  Нет данных для миграции")
        await Database.disconnect()
        return
    
    if limit:
        print(f"⚠️  Ограничение: будет обработано максимум {limit} записей")
    
    if dry_run:
        print("\n🔍 DRY RUN MODE - данные НЕ будут записаны в Google Sheets\n")
    else:
        print("\n⚡ Начинаем миграцию...\n")
    
    # Счетчики
    success_count = 0
    error_count = 0
    processed = 0
    
    # Получаем регистрации
    query_limit = limit if limit else 0
    cursor = registrations_collection.find().limit(query_limit)
    
    async for reg in cursor:
        processed += 1
        
        # Получаем информацию о турнире
        tournament = None
        try:
            tournament = await tournaments_collection.find_one({
                "_id": ObjectId(reg["tournament_id"])
            })
        except Exception as e:
            print(f"⚠️  [{processed}/{total_count}] Не удалось найти турнир для регистрации: {e}")
        
        tournament_name = tournament.get("title", "Неизвестный турнир") if tournament else "Неизвестный турнир"
        
        # Преобразуем ObjectId в строку
        reg_copy = dict(reg)
        reg_copy["_id"] = str(reg["_id"])
        
        # Форматируем вывод
        fio = reg.get("fio", "Неизвестно")
        phone = reg.get("phone", "Неизвестно")
        created_at = reg.get("created_at", datetime.utcnow())
        
        if dry_run:
            print(f"[{processed}] {fio} | {phone} | {tournament_name} | {created_at.strftime('%Y-%m-%d')}")
            success_count += 1
        else:
            # Записываем в Google Sheets
            try:
                success = await append_registration_to_sheet(
                    registration_data=reg_copy,
                    tournament_name=tournament_name
                )
                
                if success:
                    print(f"✅ [{processed}/{total_count}] {fio} → {tournament_name}")
                    success_count += 1
                else:
                    print(f"❌ [{processed}/{total_count}] {fio} → Ошибка записи")
                    error_count += 1
                    
                # Небольшая задержка чтобы не превысить rate limits Google API
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"❌ [{processed}/{total_count}] {fio} → Исключение: {e}")
                error_count += 1
        
        # Прерываем если достигли лимита
        if limit and processed >= limit:
            break
    
    # Отключаемся от БД
    await Database.disconnect()
    
    # Итоговая статистика
    print("\n" + "=" * 60)
    print("Результаты миграции")
    print("=" * 60)
    print(f"✅ Успешно обработано: {success_count}")
    if not dry_run:
        print(f"❌ Ошибок: {error_count}")
    print(f"📊 Всего обработано: {processed}")
    print("=" * 60)
    
    if dry_run:
        print("\nℹ️  Это был dry run. Для реальной миграции запустите без --dry-run")


def main():
    """Точка входа скрипта."""
    parser = argparse.ArgumentParser(
        description="Миграция регистраций из MongoDB в Google Sheets"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Показать данные без записи в Google Sheets"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Максимальное количество записей для миграции"
    )
    
    args = parser.parse_args()
    
    try:
        asyncio.run(migrate_registrations(
            dry_run=args.dry_run,
            limit=args.limit
        ))
    except KeyboardInterrupt:
        print("\n\n⚠️  Миграция прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
