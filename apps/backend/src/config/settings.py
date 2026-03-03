"""Application settings and configuration."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_UNSAFE_JWT_DEFAULTS = {
    "your-secret-key-change-in-production",
    "your-secret-key-change-in-production-use-long-random-string",
    "changeme",
    "secret",
}


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project
    project_name: str = Field(default="AI Agent Orchestration")
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    debug: bool = Field(default=False)

    # API
    backend_api_key: str = Field(default="")
    cors_origins: list[str] = Field(default=["http://localhost:3000"])

    # Database (PostgreSQL)
    database_url: str = Field(
        default="postgresql://starter_user:local_dev_password@localhost:5433/starter_db",
        description="PostgreSQL connection URL"
    )

    # JWT Authentication
    jwt_secret_key: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT token signing"
    )
    jwt_expire_minutes: int = Field(default=60, description="JWT token expiration in minutes")

    # Webhook
    webhook_secret: str = Field(
        default="",
        description="HMAC secret for verifying webhook signatures"
    )

    @model_validator(mode="after")
    def _reject_unsafe_defaults_in_production(self) -> "Settings":
        """Reject insecure default secrets when running in production."""
        if self.environment == "production":
            if self.jwt_secret_key in _UNSAFE_JWT_DEFAULTS:
                raise ValueError(
                    "JWT_SECRET_KEY must be changed from the default value "
                    "before running in production."
                )
            if len(self.jwt_secret_key) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be at least 32 characters in production."
                )
        return self

    # AI Provider Configuration
    ai_provider: str = Field(
        default="ollama",
        description="AI provider: 'ollama' (local) or 'anthropic' (cloud)"
    )

    # Ollama (Local AI - No API key required)
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="Ollama server URL"
    )
    ollama_model: str = Field(
        default="llama3.1:8b",
        description="Ollama model for generation"
    )
    ollama_embedding_model: str = Field(
        default="nomic-embed-text",
        description="Ollama model for embeddings"
    )

    # Cloud AI Models (Optional)
    anthropic_api_key: str = Field(default="", description="Anthropic API key (optional)")
    google_ai_api_key: str = Field(default="", description="Google AI API key (optional)")
    openrouter_api_key: str = Field(default="", description="OpenRouter API key (optional)")

    # MCP Tools
    exa_api_key: str = Field(default="")
    ref_tools_api_key: str = Field(default="")

    # Model defaults
    default_model: str = Field(default="claude-sonnet-4-5-20250929")
    max_tokens: int = Field(default=4096)
    temperature: float = Field(default=0.7)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
