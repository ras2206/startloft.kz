from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import datetime, date
import re


class TournamentDates(BaseModel):
    start: str  # YYYY-MM-DD
    end: str
    start_time: Optional[str] = None  # HH:MM


class TournamentLocation(BaseModel):
    city: str
    country: str
    venue_name: str
    address: str


class TournamentFees(BaseModel):
    entry_fee: int
    currency: str = "KZT"


class PrizeItem(BaseModel):
    from_: int = Field(..., alias="from")
    to: int
    label: str
    amount: int


class TournamentPrize(BaseModel):
    fund: int
    currency: str
    items: List[PrizeItem] = []


class TournamentContact(BaseModel):
    phone: str
    whatsapp_phone: str


class Tournament(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    slug: str
    title: str
    subtitle: Optional[str] = None
    status: Literal["draft", "published", "finished"]
    registration_open: bool
    dates: TournamentDates
    location: TournamentLocation
    fees: TournamentFees
    prize: TournamentPrize
    poster_image_url: Optional[str] = None
    description: str
    format_text: str
    required_fields: List[str]
    max_participants: int = 0
    contact: TournamentContact
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class RegistrationMeta(BaseModel):
    ip: Optional[str] = None
    user_agent: Optional[str] = None


class RegistrationCreate(BaseModel):
    tournament_id: str
    fio: str
    birth_date: date  # YYYY-MM-DD
    phone: str
    category: Literal["Профессионал",  "Любитель"]
    rank: Literal["КМС", "МС", "МСМК", "ЗМС", "Не выбрано"]
    city_country: str
    comment: Optional[str] = None
    consent: bool = True
    honeypot: Optional[str] = None  # Антиспам поле (должно быть пустым)

    @validator('birth_date')
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 5:
            raise ValueError('Участник должен быть старше 18 лет')
        if age > 100:
            raise ValueError('Некорректная дата рождения')
        return v

    @validator('phone')
    def normalize_phone(cls, v):
        # Удаляем все символы кроме цифр и +
        normalized = re.sub(r'[^\d+]', '', v)
        # Проверяем формат +7XXXXXXXXXX
        if not re.match(r'^\+7\d{10}$', normalized):
            raise ValueError('Телефон должен быть в формате +7XXXXXXXXXX')
        return normalized

    @validator('consent')
    def check_consent(cls, v):
        if not v:
            raise ValueError('Необходимо согласие на обработку данных')
        return v

    @validator('honeypot')
    def check_honeypot(cls, v):
        if v:  # Если поле заполнено - это бот
            raise ValueError('Spam detected')
        return v


class Registration(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    tournament_id: str
    fio: str
    birth_date: date
    phone: str
    category: str
    rank: str
    city_country: str
    comment: Optional[str] = None
    status: Literal["new", "confirmed", "cancelled"] = "new"
    created_at: datetime
    meta: RegistrationMeta

    class Config:
        populate_by_name = True


class RegistrationResponse(BaseModel):
    success: bool
    message: str
    whatsapp_link: str
    registration_id: Optional[str] = None


class ClubSettings(BaseModel):
    club_name: str
    city: str
    address: str
    work_hours: str
    phones: List[str]
    whatsapp_phone: str
    instagram_url: str
    two_gis_url: str
    hero_title: str
    hero_subtitle: str
    about_text: str
    advantages: List[str]
