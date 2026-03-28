from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Secrets(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    llm_api_key: str

    database_url: str

    servicepay_mysql_host: str = "localhost"
    servicepay_mysql_port: int = 3306
    servicepay_mysql_user: str = "demo"
    servicepay_mysql_password: str = "demo"
    servicepay_mysql_database: str = "servicepay"

    jwt_secret: str
    master_email: str = "admin@demo.com"
    allowed_origins: str = ""  # comma-separated; empty = localhost dev only


secrets = Secrets()
