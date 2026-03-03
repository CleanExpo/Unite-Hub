"""State management for conversations and tasks."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from src.utils import get_logger

logger = get_logger(__name__)


class ConversationState(BaseModel):
    """State for a conversation."""

    id: str
    user_id: str | None = None
    messages: list[dict[str, Any]] = []
    context: dict[str, Any] = {}
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()


class TaskState(BaseModel):
    """State for a task."""

    id: str
    conversation_id: str | None = None
    description: str
    status: str = "pending"
    result: Any = None
    error: str | None = None
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()


class StateManager:
    """Manages conversation and task state."""

    def __init__(self) -> None:
        self._conversations: dict[str, ConversationState] = {}
        self._tasks: dict[str, TaskState] = {}

    def get_conversation(self, conversation_id: str) -> ConversationState | None:
        """Get a conversation by ID."""
        return self._conversations.get(conversation_id)

    def create_conversation(
        self,
        conversation_id: str,
        user_id: str | None = None,
    ) -> ConversationState:
        """Create a new conversation."""
        conversation = ConversationState(
            id=conversation_id,
            user_id=user_id,
        )
        self._conversations[conversation_id] = conversation
        logger.info("Created conversation", id=conversation_id)
        return conversation

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
    ) -> None:
        """Add a message to a conversation."""
        conversation = self._conversations.get(conversation_id)
        if not conversation:
            conversation = self.create_conversation(conversation_id)

        conversation.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        conversation.updated_at = datetime.now()

    def get_messages(self, conversation_id: str) -> list[dict[str, Any]]:
        """Get all messages for a conversation."""
        conversation = self._conversations.get(conversation_id)
        if conversation:
            return conversation.messages
        return []

    def update_context(
        self,
        conversation_id: str,
        context: dict[str, Any],
    ) -> None:
        """Update conversation context."""
        conversation = self._conversations.get(conversation_id)
        if conversation:
            conversation.context.update(context)
            conversation.updated_at = datetime.now()

    def get_task(self, task_id: str) -> TaskState | None:
        """Get a task by ID."""
        return self._tasks.get(task_id)

    def create_task(
        self,
        task_id: str,
        description: str,
        conversation_id: str | None = None,
    ) -> TaskState:
        """Create a new task."""
        task = TaskState(
            id=task_id,
            description=description,
            conversation_id=conversation_id,
        )
        self._tasks[task_id] = task
        logger.info("Created task", id=task_id)
        return task

    def update_task_status(
        self,
        task_id: str,
        status: str,
        result: Any = None,
        error: str | None = None,
    ) -> None:
        """Update task status."""
        task = self._tasks.get(task_id)
        if task:
            task.status = status
            task.result = result
            task.error = error
            task.updated_at = datetime.now()
            logger.info("Updated task", id=task_id, status=status)

    def get_conversation_tasks(self, conversation_id: str) -> list[TaskState]:
        """Get all tasks for a conversation."""
        return [
            task for task in self._tasks.values()
            if task.conversation_id == conversation_id
        ]
