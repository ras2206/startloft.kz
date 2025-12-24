from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from typing import Optional, List
import asyncio
from datetime import datetime
from bson import ObjectId

from config import settings
from database import Database, get_tournaments_collection, get_registrations_collection
from models import (
    Tournament, 
    Registration, 
    RegistrationCreate, 
    RegistrationResponse,
    ClubSettings
)
from google_sheets import append_registration_to_sheet

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    await Database.connect()
    yield
    # Shutdown
    await Database.disconnect()


app = FastAPI(
    title="Start Loft API",
    description="API для лендинга бильярдного клуба Start Loft",
    version="1.0.0",
    lifespan=lifespan
)

# Добавляем rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://startloft.kz",
        "https://www.startloft.kz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === ENDPOINTS ===

@app.get("/")
async def root():
    return {"message": "Start Loft API", "version": "1.0.0"}


@app.get("/api/tournaments", response_model=List[Tournament])
async def get_tournaments(status: Optional[str] = None):
    """Получить список турниров"""
    collection = await get_tournaments_collection()
    
    query = {}
    if status:
        query["status"] = status
    
    tournaments = await collection.find(query).to_list(length=100)
    # Преобразуем ObjectId в строку и даты к строке
    for t in tournaments:
        if t.get('_id'):
            t['_id'] = str(t['_id'])
        # Приводим даты к строке, если это datetime
        if t.get('dates'):
            if isinstance(t['dates'].get('start'), datetime):
                t['dates']['start'] = t['dates']['start'].isoformat()
            if isinstance(t['dates'].get('end'), datetime):
                t['dates']['end'] = t['dates']['end'].isoformat()
    # Сортировка: featured сверху, затем по дате
    tournaments.sort(key=lambda x: (not x.get('is_featured', False), x.get('dates', {}).get('start', '')))
    print(f"[DEBUG] Список турниров: {[t.get('slug') for t in tournaments]}")
    return tournaments



@app.get("/api/tournaments/{id}", response_model=Tournament)
async def get_tournament_by_id(id: str):
    """Получить турнир по ID"""
    collection = await get_tournaments_collection()
    try:
        tournament = await collection.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    
    # Преобразуем ObjectId в строку и даты к строке
    if tournament.get('_id'):
        tournament['_id'] = str(tournament['_id'])
    if tournament.get('dates'):
        if isinstance(tournament['dates'].get('start'), datetime):
            tournament['dates']['start'] = tournament['dates']['start'].isoformat()
        if isinstance(tournament['dates'].get('end'), datetime):
            tournament['dates']['end'] = tournament['dates']['end'].isoformat()
    
    return tournament


@app.post("/api/registrations", response_model=RegistrationResponse)
@limiter.limit("5/minute")
async def create_registration(
    registration: RegistrationCreate,
    request: Request
):
    """Создать заявку на турнир"""
    
    # Получаем метаданные
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    
    # Получаем информацию о турнире
    tournaments_collection = await get_tournaments_collection()
    from bson import ObjectId
    try:
        tournament = await tournaments_collection.find_one({"_id": ObjectId(registration.tournament_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    
    if not tournament.get("registration_open", False):
        raise HTTPException(status_code=400, detail="Регистрация на этот турнир закрыта")
    
    # Формируем документ для сохранения
    registration_doc = {
        "tournament_id": registration.tournament_id,
        "fio": registration.fio,
        "birth_date": registration.birth_date,
        "phone": registration.phone,
        "category": registration.category,
        "rank": registration.rank,
        "city_country": registration.city_country,
        "comment": registration.comment,
        "status": "new",
        "created_at": datetime.utcnow(),
        "meta": {
            "ip": client_ip,
            "user_agent": user_agent
        }
    }
    
    # Запись только в MongoDB
    async def save_to_mongo():
        registrations_collection = await get_registrations_collection()
        try:
            result = await registrations_collection.insert_one(registration_doc)
            return str(result.inserted_id)
        except Exception as e:
            if "duplicate key error" in str(e):
                raise HTTPException(
                    status_code=400, 
                    detail="Вы уже зарегистрированы на этот турнир"
                )
            raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {str(e)}")
    
    registration_id = await save_to_mongo()
    
    # Сохраняем в Google Sheets (не блокирует успех регистрации если произойдет ошибка)
    try:
        registration_doc["_id"] = registration_id
        await append_registration_to_sheet(
            registration_data=registration_doc,
            tournament_name=tournament.get("title")
        )
    except Exception as e:
        # Логируем ошибку, но не прерываем процесс регистрации
        print(f"Warning: Failed to save to Google Sheets: {e}")
    
    # Формируем WhatsApp ссылку
    whatsapp_phone = "7718215088"
    whatsapp_text = (
        f"Здравствуйте!%0A"
        f"Я хочу зарегистрироваться на турнир:%0A"
        f"🏆 *{tournament['title']}*%0A"
        f"%0A"
        f"👤 *ФИО:* {registration.fio}%0A"
        f"🌍 *Город:* {registration.city_country}%0A"
        f"🎯 *Категория:* {registration.category}%0A"
        f"🏅 *Разряд:* {registration.rank}%0A"
    )
    whatsapp_link = f"https://wa.me/{whatsapp_phone.replace('+', '')}?text={whatsapp_text}"
    
    return RegistrationResponse(
        success=True,
        message="Заявка успешно принята!",
        whatsapp_link=whatsapp_link,
        registration_id=registration_id
    )


@app.get("/api/tournaments/{tournament_id}/registrations")
async def get_tournament_registrations(tournament_id: str):
    """Получить список зарегистрированных участников (без телефонов)"""
    collection = await get_registrations_collection()
    
    print(f"[DEBUG] Запрос участников для турнира: {tournament_id}")
    
    registrations = await collection.find(
        {"tournament_id": tournament_id, "status": {"$ne": "cancelled"}}
    ).to_list(length=1000)
    
    print(f"[DEBUG] Найдено участников: {len(registrations)}")
    if registrations:
        print(f"[DEBUG] Пример tournament_id в базе: {registrations[0].get('tournament_id')}")
    
    # Убираем чувствительные данные
    public_registrations = []
    for reg in registrations:
        public_registrations.append({
            "fio": reg.get("fio"),
            "rank": reg.get("rank"),
            "category": reg.get("category"),
            "city_country": reg.get("city_country"),
        })
    
    return public_registrations


@app.get("/api/club-settings", response_model=ClubSettings)
async def get_club_settings():
    """Получить настройки клуба (статичные значения)"""
    return ClubSettings(
        club_name="Start Loft",
        city="Кызылорда",
        address="ул. Абая, 123",
        work_hours="10:00-02:00",
        phones=["+7 771 821 50 88"],
        whatsapp_phone="+7 771 821 50 88",
        instagram_url="https://instagram.com/startloft.kz",
        two_gis_url="https://2gis.kz/kyzylorda/geo/70000001100786145",
        hero_title="Start Loft — бильярдный клуб в Кызылорде",
        hero_subtitle="Турниры, атмосфера лофта и честная игра. Запись на турнир — за 1 минуту.",
        about_text="Start Loft — место, где собираются те, кто любит бильярд.",
        advantages=["Профессиональные столы", "Уютная атмосфера", "Регулярные турниры", "Доступные цены"]
    )

from models import Tournament
from database import get_tournaments_collection
from fastapi import HTTPException, status, Body
from datetime import datetime
from typing import Any

@app.post("/api/tournaments", status_code=201, include_in_schema=True, response_model=dict)
async def create_tournament(tournament: dict = Body(...)):
    """
    Универсальный эндпоинт для добавления турниров в MongoDB.
    Принимает любые поля, соответствующие модели Tournament.
    """
    collection = await get_tournaments_collection()
    now = datetime.utcnow()
    tournament["created_at"] = now
    tournament["updated_at"] = now
    if "slug" not in tournament:
        tournament["slug"] = tournament["title"].lower().replace(" ", "-")
    if "status" not in tournament:
        tournament["status"] = "draft"
    # Для валидации: подставляем временный _id только для Pydantic, не сохраняем в БД
    import uuid
    temp_id = str(uuid.uuid4())
    t = None
    try:
        t = Tournament(**{**tournament, "_id": temp_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка валидации: {e}")
    # Сохраняем в MongoDB без _id/id — Mongo сам сгенерирует
    to_save = t.dict(by_alias=True, exclude={"id"})
    to_save.pop("_id", None)
    result = await collection.insert_one(to_save)
    return {"_id": str(result.inserted_id), "slug": t.slug, "title": t.title}
    # Сохраняем в MongoDB
    result = await collection.insert_one(t.dict(by_alias=True))
    raise HTTPException(status_code=400, detail=f"Ошибка валидации: {e}")
    # Сохраняем в MongoDB
    result = await collection.insert_one(t.dict(by_alias=True))
    return {"_id": t.id, "slug": t.slug, "title": t.title}
    # Сохраняем в MongoDB
    result = await collection.insert_one(t.dict(by_alias=True))
    return {"_id": t.id, "slug": t.slug, "title": t.title}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "fastapi_start_loft:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
