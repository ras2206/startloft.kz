from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    database_name: str = "startloft"
        # Security
    admin_token: str  # ← добавлено для поддержки ADMIN_TOKEN из .env
    admin_sync_token: str
    # CORS
    frontend_url: str = "http://localhost:3000"
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    # Google Sheets Integration
    google_sheets_enabled: bool = True
    google_sheets_credentials_file: Optional[str] = "start-loft-cb70bbfaa5b7.json"
    google_sheets_spreadsheet_id: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
