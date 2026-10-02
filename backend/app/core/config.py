from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MediTrust API"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/meditrust"
    secret_key: str = "change-me-in-env"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,https://meditrust-zeta.vercel.app"

    map_provider: str = "openstreetmap"
    geocoding_provider: str = ""

    sms_provider: str = ""
    sms_api_key: str = ""

    google_maps_api_key: str = ""

    # Email (SMTP) for welcome / login notifications.
    # Emails are skipped when smtp_host or smtp_username is empty.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    email_from: str = ""

    # Comma-separated OAuth client IDs accepted for Google sign-in
    google_client_id: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            x.strip()
            for x in self.allowed_origins.split(",")
            if x.strip()
        ]

    @property
    def google_client_ids(self) -> list[str]:
        return [
            x.strip()
            for x in self.google_client_id.split(",")
            if x.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()