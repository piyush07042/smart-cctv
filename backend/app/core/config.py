from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost/okdriver"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "your_super_secret_key_change_in_production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Fernet key for stream credential encryption.
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # NEVER commit the real key; this default is for local dev/tests ONLY.
    FERNET_KEY: str = "uA6kJ4fT2Vt_4Ch6qm3pnTNrzAuOPO6VgtA2OTkrIC4="
    DEMO_ADMIN_USERNAME: str = "admin"
    DEMO_ADMIN_PASSWORD: str = "admin"
    DEMO_OPERATOR_USERNAME: str = "operator"
    DEMO_OPERATOR_PASSWORD: str = "operator"
    DEMO_VIEWER_USERNAME: str = "viewer"
    DEMO_VIEWER_PASSWORD: str = "viewer"
    
    # Phase 6 Health configuration
    HEALTH_CHECK_INTERVAL_SECONDS: int = 10
    HEARTBEAT_ONLINE_SECONDS: int = 30
    HEARTBEAT_OFFLINE_SECONDS: int = 60
    HEALTH_FAILURE_HYSTERESIS: int = 2
    DEGRADED_FPS_THRESHOLD: int = 10
    DEGRADED_LATENCY_MS: int = 1000
    DEGRADED_PACKET_LOSS_PERCENT: float = 5.0
    
    # API key for pushing heartbeat data
    HEARTBEAT_API_KEY: str = "service-key-for-heartbeat"

    # Phase 7 Analytics / Events / Watchlist / Alerts
    ANALYTICS_API_KEY: str = "analytics-service-key"
    EVENT_DEDUP_WINDOW_SECONDS: int = 300
    ANPR_SUPPRESSION_WINDOW_SECONDS: int = 15
    ALERT_COOLDOWN_SECONDS: int = 60
    EVENT_RATE_LIMIT_PER_MINUTE: int = 120
    ANALYTICS_API_URL: str = "http://localhost:8000"
    ANALYTICS_INTERVAL_SECONDS: float = 2.0
    ANALYTICS_DEMO_PLATE: str = "GJ01XX0001"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra env vars (POSTGRES_DB, FERNET_KEY, etc.)
    )


settings = Settings()