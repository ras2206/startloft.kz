from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings
from typing import Optional


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls):
        """Подключение к MongoDB"""
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        cls.db = cls.client[settings.database_name]
        
        # Создаём уникальный индекс для предотвращения дублей заявок
        await cls.db.registrations.create_index(
            [("tournament_id", 1), ("phone", 1)],
            unique=True
        )
        
        print(f"✅ Подключено к MongoDB: {settings.database_name}")

    @classmethod
    async def disconnect(cls):
        """Отключение от MongoDB"""
        if cls.client:
            cls.client.close()
            print("❌ Отключено от MongoDB")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Получить экземпляр базы данных"""
        return cls.db


# Функции для работы с коллекциями
async def get_tournaments_collection():
    db = Database.get_db()
    return db.tournaments


async def get_registrations_collection():
    db = Database.get_db()
    return db.registrations
