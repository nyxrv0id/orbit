"""Application configuration settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable loading."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Optional GitHub Personal Access Token
    github_token: str | None = None

    # Server configuration
    orbit_host: str = "0.0.0.0"
    orbit_port: int = 8000

    # Caching configuration
    cache_ttl_seconds: int = 300

    # HTTP client timeout
    http_timeout_seconds: float = 10.0

    # CORS origins (stored as comma-separated in env, parsed to list)
    orbit_cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS origins as a list of strings."""
        return [origin.strip() for origin in self.orbit_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
