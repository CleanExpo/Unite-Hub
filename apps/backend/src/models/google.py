"""Google Gemini API client."""

from typing import Any

import google.generativeai as genai

from src.config import get_settings
from src.utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


class GoogleClient:
    """Client for Google Gemini API."""

    # Available models
    GEMINI_PRO = "gemini-2.0-flash-exp"

    def __init__(self, model: str | None = None) -> None:
        genai.configure(api_key=settings.google_ai_api_key)
        self.model_name = model or self.GEMINI_PRO
        self.model = genai.GenerativeModel(self.model_name)

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
    ) -> str:
        """Generate a completion from Gemini.

        Args:
            prompt: The user prompt
            system: Optional system prompt (prepended to prompt)

        Returns:
            The model's response text
        """
        try:
            full_prompt = f"{system}\n\n{prompt}" if system else prompt

            response = await self.model.generate_content_async(full_prompt)
            return response.text

        except Exception as e:
            logger.error("Google API error", error=str(e))
            raise

    async def chat(
        self,
        messages: list[dict[str, str]],
        system: str | None = None,
    ) -> str:
        """Multi-turn chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: Optional system prompt

        Returns:
            The model's response text
        """
        try:
            chat = self.model.start_chat(history=[])

            # Add system message if provided
            if system:
                await chat.send_message_async(f"System: {system}")

            # Process all messages
            for msg in messages:
                if msg["role"] == "user":
                    response = await chat.send_message_async(msg["content"])

            return response.text

        except Exception as e:
            logger.error("Google chat error", error=str(e))
            raise

    async def with_tools(
        self,
        prompt: str,
        tools: list[dict[str, Any]],
        system: str | None = None,
    ) -> dict[str, Any]:
        """Generate a completion with function calling.

        Args:
            prompt: The user prompt
            tools: List of tool/function definitions
            system: Optional system prompt

        Returns:
            The model's response including function calls
        """
        try:
            # Configure tools for the model
            model_with_tools = genai.GenerativeModel(
                self.model_name,
                tools=tools,
            )

            full_prompt = f"{system}\n\n{prompt}" if system else prompt
            response = await model_with_tools.generate_content_async(full_prompt)

            return {
                "text": response.text if response.text else None,
                "candidates": response.candidates,
            }

        except Exception as e:
            logger.error("Google tool use error", error=str(e))
            raise
