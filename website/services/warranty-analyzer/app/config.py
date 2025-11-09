"""
Application configuration using Pydantic settings
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Anthropic API
    anthropic_api_key: str = Field(..., description="Anthropic API key")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/snapregister",
        description="Database connection URL",
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0", description="Redis connection URL"
    )

    # Service Configuration
    service_host: str = Field(default="0.0.0.0", description="Service host")
    service_port: int = Field(default=8001, description="Service port")
    workers: int = Field(default=4, description="Number of worker processes")

    # Environment
    environment: Literal["development", "staging", "production"] = Field(
        default="development", description="Environment"
    )

    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins",
    )

    # File Storage
    upload_dir: Path = Field(
        default=Path("/tmp/warranty-uploads"), description="Upload directory"
    )
    max_file_size: int = Field(default=10_485_760, description="Max file size in bytes (10MB)")

    # Claude AI Configuration
    claude_model: str = Field(
        default="claude-3-5-sonnet-20241022", description="Claude model to use"
    )
    claude_max_tokens: int = Field(default=4096, description="Max tokens for Claude response")
    claude_temperature: float = Field(
        default=0.3, description="Temperature for Claude generation"
    )

    # OCR Configuration
    tesseract_path: str = Field(
        default="/usr/bin/tesseract", description="Path to tesseract binary"
    )

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )
    log_format: Literal["json", "text"] = Field(default="json", description="Log format")

    # Rate Limiting
    rate_limit_per_minute: int = Field(
        default=10, description="Rate limit per minute per user"
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list[str]) -> list[str]:
        """Parse ALLOWED_ORIGINS from comma-separated string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("upload_dir", mode="before")
    @classmethod
    def parse_upload_dir(cls, v: str | Path) -> Path:
        """Ensure upload_dir is a Path object"""
        return Path(v) if isinstance(v, str) else v

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
