"""Workflow storage layer using Supabase."""

from datetime import datetime

from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

from .models import (
    ExecutionContext,
    ExecutionStatus,
    WorkflowDefinition,
)

logger = get_logger(__name__)


class WorkflowStorage:
    """Storage layer for workflows and executions."""

    def __init__(self) -> None:
        self.supabase = SupabaseStateStore()

    async def create_workflow(
        self,
        workflow: WorkflowDefinition,
        user_id: str | None = None,
    ) -> WorkflowDefinition:
        """Create a new workflow."""
        try:
            data = {
                "id": workflow.id,
                "user_id": user_id,
                "name": workflow.name,
                "description": workflow.description,
                "version": workflow.version,
                "definition": {
                    "nodes": [node.model_dump() for node in workflow.nodes],
                    "edges": [edge.model_dump() for edge in workflow.edges],
                    "variables": workflow.variables,
                },
                "is_published": workflow.is_published,
                "skill_compatibility": workflow.skill_compatibility,
                "tags": workflow.tags,
                "created_by": workflow.created_by or user_id,
            }

            _result = self.supabase.client.table("workflows").insert(data).execute()

            logger.info(
                "Created workflow",
                workflow_id=workflow.id,
                name=workflow.name,
            )

            return workflow

        except Exception as e:
            logger.error("Failed to create workflow", error=str(e))
            raise

    async def get_workflow(self, workflow_id: str) -> WorkflowDefinition | None:
        """Get workflow by ID."""
        try:
            result = (
                self.supabase.client.table("workflows")
                .select("*")
                .eq("id", workflow_id)
                .single()
                .execute()
            )

            if not result.data:
                return None

            data = result.data
            definition = data.get("definition", {})

            workflow = WorkflowDefinition(
                id=data["id"],
                name=data["name"],
                description=data.get("description"),
                version=data.get("version", "1.0.0"),
                nodes=[],
                edges=[],
                variables=definition.get("variables", {}),
                skill_compatibility=data.get("skill_compatibility", []),
                tags=data.get("tags", []),
                is_published=data.get("is_published", False),
                created_at=data.get("created_at", datetime.now().isoformat()),
                updated_at=data.get("updated_at", datetime.now().isoformat()),
                created_by=data.get("created_by"),
            )

            return workflow

        except Exception as e:
            logger.error("Failed to get workflow", error=str(e))
            return None

    async def update_workflow(
        self,
        workflow_id: str,
        workflow: WorkflowDefinition,
    ) -> WorkflowDefinition | None:
        """Update an existing workflow."""
        try:
            data = {
                "name": workflow.name,
                "description": workflow.description,
                "version": workflow.version,
                "definition": {
                    "nodes": [node.model_dump() for node in workflow.nodes],
                    "edges": [edge.model_dump() for edge in workflow.edges],
                    "variables": workflow.variables,
                },
                "is_published": workflow.is_published,
                "skill_compatibility": workflow.skill_compatibility,
                "tags": workflow.tags,
                "updated_at": datetime.now().isoformat(),
            }

            result = (
                self.supabase.client.table("workflows")
                .update(data)
                .eq("id", workflow_id)
                .execute()
            )

            if not result.data:
                return None

            logger.info("Updated workflow", workflow_id=workflow_id)
            return workflow

        except Exception as e:
            logger.error("Failed to update workflow", error=str(e))
            return None

    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow."""
        try:
            self.supabase.client.table("workflows").delete().eq(
                "id", workflow_id
            ).execute()

            logger.info("Deleted workflow", workflow_id=workflow_id)
            return True

        except Exception as e:
            logger.error("Failed to delete workflow", error=str(e))
            return False

    async def list_workflows(
        self,
        user_id: str | None = None,
        is_published: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[WorkflowDefinition]:
        """List workflows with optional filters."""
        try:
            query = self.supabase.client.table("workflows").select("*")

            if user_id:
                query = query.eq("user_id", user_id)

            if is_published is not None:
                query = query.eq("is_published", is_published)

            result = (
                query.order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )

            workflows = []
            for data in result.data or []:
                definition = data.get("definition", {})
                workflow = WorkflowDefinition(
                    id=data["id"],
                    name=data["name"],
                    description=data.get("description"),
                    version=data.get("version", "1.0.0"),
                    nodes=[],
                    edges=[],
                    variables=definition.get("variables", {}),
                    skill_compatibility=data.get("skill_compatibility", []),
                    tags=data.get("tags", []),
                    is_published=data.get("is_published", False),
                    created_at=data.get("created_at", datetime.now().isoformat()),
                    updated_at=data.get("updated_at", datetime.now().isoformat()),
                    created_by=data.get("created_by"),
                )
                workflows.append(workflow)

            return workflows

        except Exception as e:
            logger.error("Failed to list workflows", error=str(e))
            return []

    async def create_execution(
        self,
        context: ExecutionContext,
    ) -> ExecutionContext:
        """Create a new workflow execution."""
        try:
            data = {
                "id": context.execution_id,
                "workflow_id": context.workflow_id,
                "user_id": context.user_id,
                "status": context.status.value,
                "variables": context.variables,
                "current_node_id": context.current_node_id,
                "completed_nodes": list(context.completed_nodes),
                "failed_nodes": list(context.failed_nodes),
                "node_outputs": context.node_outputs,
                "logs": context.logs,
                "started_at": context.started_at,
            }

            _result = (
                self.supabase.client.table("workflow_executions").insert(data).execute()
            )

            logger.info(
                "Created execution",
                execution_id=context.execution_id,
                workflow_id=context.workflow_id,
            )

            return context

        except Exception as e:
            logger.error("Failed to create execution", error=str(e))
            raise

    async def update_execution(
        self,
        execution_id: str,
        context: ExecutionContext,
    ) -> None:
        """Update workflow execution state."""
        try:
            data = {
                "status": context.status.value,
                "variables": context.variables,
                "current_node_id": context.current_node_id,
                "completed_nodes": list(context.completed_nodes),
                "failed_nodes": list(context.failed_nodes),
                "node_outputs": context.node_outputs,
                "logs": context.logs,
                "updated_at": datetime.now().isoformat(),
            }

            if context.completed_at:
                data["completed_at"] = context.completed_at

            self.supabase.client.table("workflow_executions").update(data).eq(
                "id", execution_id
            ).execute()

            logger.debug(
                "Updated execution",
                execution_id=execution_id,
                status=context.status.value,
            )

        except Exception as e:
            logger.error("Failed to update execution", error=str(e))
            raise

    async def get_execution(
        self,
        execution_id: str,
    ) -> ExecutionContext | None:
        """Get execution context by ID."""
        try:
            result = (
                self.supabase.client.table("workflow_executions")
                .select("*")
                .eq("id", execution_id)
                .single()
                .execute()
            )

            if not result.data:
                return None

            data = result.data
            context = ExecutionContext(
                execution_id=data["id"],
                workflow_id=data["workflow_id"],
                user_id=data.get("user_id"),
                variables=data.get("variables", {}),
                current_node_id=data.get("current_node_id"),
                completed_nodes=set(data.get("completed_nodes", [])),
                failed_nodes=set(data.get("failed_nodes", [])),
                node_outputs=data.get("node_outputs", {}),
                logs=data.get("logs", []),
                started_at=data.get("started_at", datetime.now().isoformat()),
                completed_at=data.get("completed_at"),
                status=ExecutionStatus(data.get("status", "pending")),
            )

            return context

        except Exception as e:
            logger.error("Failed to get execution", error=str(e))
            return None
