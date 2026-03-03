"""Subagent Manager - Manages lifecycle of parallel subagents.

Handles:
- Spawning specialized subagents
- Monitoring progress
- Collecting outputs
- Handling failures
- Coordinating parallel execution
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from src.agents.base_agent import BaseAgent, TaskOutput
from src.agents.registry import AgentRegistry
from src.utils import get_logger

logger = get_logger(__name__)


class SubagentStatus(str, Enum):
    """Status of a subagent."""

    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class SubTask(BaseModel):
    """A subtask to be executed by a subagent."""

    subtask_id: str
    description: str
    agent_type: str  # frontend, backend, database, test, review
    context: dict[str, Any] = Field(default_factory=dict)
    dependencies: list[str] = Field(default_factory=list)  # IDs of subtasks that must complete first
    priority: int = Field(default=5)  # 1=highest, 10=lowest


class SubagentConfig(BaseModel):
    """Configuration for spawning a subagent."""

    agent_type: str
    task: SubTask
    context_partition: dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = Field(default=300)  # 5 minutes
    max_retries: int = Field(default=2)


class SubagentResult(BaseModel):
    """Result from a subagent execution."""

    subtask_id: str
    agent_id: str
    agent_type: str
    status: SubagentStatus
    result: Any = None
    task_output: TaskOutput | None = None
    error: str | None = None
    started_at: str
    completed_at: str | None = None
    duration_seconds: float | None = None


class SubagentManager:
    """Manages lifecycle of parallel subagents."""

    def __init__(self, registry: AgentRegistry | None = None) -> None:
        """Initialize subagent manager.

        Args:
            registry: Agent registry (creates new if not provided)
        """
        self.registry = registry or AgentRegistry()
        self._active_subagents: dict[str, dict[str, Any]] = {}

    async def launch(
        self,
        configs: list[SubagentConfig]
    ) -> list[BaseAgent]:
        """Launch multiple subagents.

        Args:
            configs: List of subagent configurations

        Returns:
            List of spawned agents
        """
        agents = []

        for config in configs:
            try:
                agent = await self._spawn_subagent(config)
                agents.append(agent)

                self._active_subagents[config.task.subtask_id] = {
                    "agent": agent,
                    "config": config,
                    "status": SubagentStatus.CREATED,
                    "started_at": datetime.now().isoformat()
                }

                logger.info(
                    "Subagent launched",
                    subtask_id=config.task.subtask_id,
                    agent_type=config.agent_type,
                    agent_id=agent.get_agent_id()
                )

            except Exception as e:
                logger.error(
                    "Failed to launch subagent",
                    agent_type=config.agent_type,
                    error=str(e)
                )
                # Continue with other agents

        return agents

    async def _spawn_subagent(
        self,
        config: SubagentConfig
    ) -> BaseAgent:
        """Spawn a single subagent.

        Args:
            config: Subagent configuration

        Returns:
            Spawned agent instance
        """
        # Get agent from registry
        agent = self.registry.get_agent(config.agent_type)

        if not agent:
            # Create new agent if not in registry
            agent = self.registry.create_agent(config.agent_type)

        if not agent:
            raise ValueError(f"Cannot create agent of type: {config.agent_type}")

        # Load relevant skills for this agent
        if hasattr(agent, "load_relevant_skills"):
            agent.load_relevant_skills(config.task.description)

        return agent

    async def execute_parallel(
        self,
        configs: list[SubagentConfig]
    ) -> list[SubagentResult]:
        """Execute multiple subagents in parallel.

        Args:
            configs: List of subagent configurations

        Returns:
            List of results from all subagents
        """
        logger.info(
            "Starting parallel execution",
            subagent_count=len(configs)
        )

        # Resolve dependencies and create execution order
        execution_plan = self._resolve_dependencies(configs)

        all_results = []

        # Execute in waves based on dependencies
        for wave in execution_plan:
            logger.info(
                "Executing wave",
                wave_number=execution_plan.index(wave) + 1,
                subtasks_in_wave=len(wave)
            )

            # Execute this wave in parallel
            wave_tasks = [
                self._execute_subagent(config)
                for config in wave
            ]

            wave_results = await asyncio.gather(*wave_tasks, return_exceptions=True)

            # Process results
            for i, result in enumerate(wave_results):
                if isinstance(result, Exception):
                    # Handle exception
                    logger.error(
                        "Subagent failed with exception",
                        config=wave[i].model_dump(),
                        error=str(result)
                    )
                    all_results.append(SubagentResult(
                        subtask_id=wave[i].task.subtask_id,
                        agent_id="unknown",
                        agent_type=wave[i].agent_type,
                        status=SubagentStatus.FAILED,
                        error=str(result),
                        started_at=datetime.now().isoformat()
                    ))
                else:
                    all_results.append(result)

        logger.info(
            "Parallel execution complete",
            total_subtasks=len(configs),
            successful=sum(1 for r in all_results if r.status == SubagentStatus.COMPLETED),
            failed=sum(1 for r in all_results if r.status == SubagentStatus.FAILED)
        )

        return all_results

    async def _execute_subagent(
        self,
        config: SubagentConfig
    ) -> SubagentResult:
        """Execute a single subagent with timeout and retries.

        Args:
            config: Subagent configuration

        Returns:
            Subagent result
        """
        started_at = datetime.now()

        # Update status
        if config.task.subtask_id in self._active_subagents:
            self._active_subagents[config.task.subtask_id]["status"] = SubagentStatus.RUNNING

        try:
            # Get agent
            agent = self.registry.get_agent(config.agent_type)
            if not agent:
                agent = self.registry.create_agent(config.agent_type)

            if not agent:
                raise ValueError(f"Cannot get/create agent: {config.agent_type}")

            # Execute with timeout
            result = await asyncio.wait_for(
                agent.execute(config.task.description, config.context_partition),
                timeout=config.timeout_seconds
            )

            # Extract task output
            task_output = None
            if isinstance(result, dict) and "task_output" in result:
                task_output = TaskOutput(**result["task_output"])

            # Calculate duration
            completed_at = datetime.now()
            duration = (completed_at - started_at).total_seconds()

            # Create result
            subagent_result = SubagentResult(
                subtask_id=config.task.subtask_id,
                agent_id=agent.get_agent_id(),
                agent_type=config.agent_type,
                status=SubagentStatus.COMPLETED,
                result=result,
                task_output=task_output,
                started_at=started_at.isoformat(),
                completed_at=completed_at.isoformat(),
                duration_seconds=duration
            )

            # Update tracking
            if config.task.subtask_id in self._active_subagents:
                self._active_subagents[config.task.subtask_id].update({
                    "status": SubagentStatus.COMPLETED,
                    "result": subagent_result,
                    "completed_at": completed_at.isoformat()
                })

            logger.info(
                "Subagent completed",
                subtask_id=config.task.subtask_id,
                agent_type=config.agent_type,
                duration=duration
            )

            return subagent_result

        except TimeoutError:
            logger.error(
                "Subagent timed out",
                subtask_id=config.task.subtask_id,
                timeout=config.timeout_seconds
            )

            return SubagentResult(
                subtask_id=config.task.subtask_id,
                agent_id="unknown",
                agent_type=config.agent_type,
                status=SubagentStatus.FAILED,
                error=f"Timeout after {config.timeout_seconds}s",
                started_at=started_at.isoformat()
            )

        except Exception as e:
            logger.error(
                "Subagent failed",
                subtask_id=config.task.subtask_id,
                error=str(e)
            )

            return SubagentResult(
                subtask_id=config.task.subtask_id,
                agent_id="unknown",
                agent_type=config.agent_type,
                status=SubagentStatus.FAILED,
                error=str(e),
                started_at=started_at.isoformat()
            )

    def _resolve_dependencies(
        self,
        configs: list[SubagentConfig]
    ) -> list[list[SubagentConfig]]:
        """Resolve dependencies and create execution waves.

        Subtasks with dependencies run after their dependencies complete.
        Subtasks without dependencies run in parallel.

        Args:
            configs: List of subagent configurations

        Returns:
            List of waves, where each wave can execute in parallel
        """
        # Build dependency graph
        completed: set[str] = set()
        waves: list[list[SubagentConfig]] = []

        remaining = configs.copy()

        while remaining:
            # Find subtasks that can run now (dependencies met)
            can_run = [
                config for config in remaining
                if all(dep in completed for dep in config.task.dependencies)
            ]

            if not can_run:
                # Circular dependency or missing dependency
                logger.error(
                    "Circular dependency detected or missing subtasks",
                    remaining=[c.task.subtask_id for c in remaining]
                )
                # Run remaining anyway to avoid deadlock
                can_run = remaining

            # Add wave
            waves.append(can_run)

            # Mark as completed for next wave
            for config in can_run:
                completed.add(config.task.subtask_id)

            # Remove from remaining
            remaining = [c for c in remaining if c not in can_run]

        logger.debug(
            "Dependency resolution complete",
            total_waves=len(waves),
            subtasks_per_wave=[len(w) for w in waves]
        )

        return waves

    async def monitor_progress(
        self,
        subtask_ids: list[str]
    ) -> dict[str, SubagentStatus]:
        """Monitor progress of multiple subagents.

        Args:
            subtask_ids: IDs of subtasks to monitor

        Returns:
            Dict mapping subtask_id to current status
        """
        status_map = {}

        for subtask_id in subtask_ids:
            if subtask_id in self._active_subagents:
                status_map[subtask_id] = self._active_subagents[subtask_id]["status"]
            else:
                status_map[subtask_id] = SubagentStatus.CREATED

        return status_map

    async def collect_outputs(
        self,
        subtask_ids: list[str]
    ) -> list[SubagentResult]:
        """Collect outputs from completed subagents.

        Args:
            subtask_ids: IDs of subtasks to collect from

        Returns:
            List of subagent results
        """
        results = []

        for subtask_id in subtask_ids:
            if subtask_id in self._active_subagents:
                tracking = self._active_subagents[subtask_id]
                if "result" in tracking:
                    results.append(tracking["result"])

        return results

    async def handle_failures(
        self,
        failed_results: list[SubagentResult]
    ) -> dict[str, Any]:
        """Handle failed subagents.

        Args:
            failed_results: List of failed subagent results

        Returns:
            Dict with failure analysis and suggestions
        """
        analysis = {
            "total_failures": len(failed_results),
            "failures_by_type": {},
            "suggestions": []
        }

        # Categorize failures
        for result in failed_results:
            failure_type = self._categorize_failure(result.error or "unknown")
            analysis["failures_by_type"][failure_type] = \
                analysis["failures_by_type"].get(failure_type, 0) + 1

        # Generate suggestions
        if "timeout" in analysis["failures_by_type"]:
            analysis["suggestions"].append(
                "Increase timeout or break tasks into smaller pieces"
            )

        if "dependency" in analysis["failures_by_type"]:
            analysis["suggestions"].append(
                "Check dependency resolution and execution order"
            )

        logger.warning(
            "Handled subagent failures",
            total=len(failed_results),
            by_type=analysis["failures_by_type"]
        )

        return analysis

    def _categorize_failure(self, error: str) -> str:
        """Categorize failure type from error message."""
        error_lower = error.lower()

        if "timeout" in error_lower:
            return "timeout"
        if "dependency" in error_lower or "depend" in error_lower:
            return "dependency"
        if "permission" in error_lower or "access" in error_lower:
            return "permission"
        if "not found" in error_lower:
            return "not_found"
        if "import" in error_lower or "module" in error_lower:
            return "import"

        return "unknown"

    async def cancel_subagent(self, subtask_id: str) -> bool:
        """Cancel a running subagent.

        Args:
            subtask_id: ID of subtask to cancel

        Returns:
            True if cancelled, False if not found or already completed
        """
        if subtask_id not in self._active_subagents:
            return False

        tracking = self._active_subagents[subtask_id]

        if tracking["status"] in [SubagentStatus.COMPLETED, SubagentStatus.FAILED]:
            return False  # Already done

        # Mark as cancelled
        tracking["status"] = SubagentStatus.CANCELLED

        logger.info("Subagent cancelled", subtask_id=subtask_id)

        return True

    async def get_active_count(self) -> int:
        """Get count of currently running subagents.

        Returns:
            Number of running subagents
        """
        return sum(
            1 for tracking in self._active_subagents.values()
            if tracking["status"] == SubagentStatus.RUNNING
        )

    async def cleanup(self) -> None:
        """Clean up completed and failed subagents."""
        to_remove = [
            subtask_id
            for subtask_id, tracking in self._active_subagents.items()
            if tracking["status"] in [
                SubagentStatus.COMPLETED,
                SubagentStatus.FAILED,
                SubagentStatus.CANCELLED
            ]
        ]

        for subtask_id in to_remove:
            del self._active_subagents[subtask_id]

        logger.debug("Cleanup complete", removed=len(to_remove))

    async def wait_for_all(
        self,
        subtask_ids: list[str],
        timeout: int = 600
    ) -> list[SubagentResult]:
        """Wait for all subagents to complete.

        Args:
            subtask_ids: IDs of subtasks to wait for
            timeout: Max wait time in seconds

        Returns:
            List of results

        Raises:
            TimeoutError: If timeout exceeded
        """
        start_time = datetime.now()

        while True:
            # Check if all complete
            status_map = await self.monitor_progress(subtask_ids)

            all_done = all(
                status in [SubagentStatus.COMPLETED, SubagentStatus.FAILED, SubagentStatus.CANCELLED]
                for status in status_map.values()
            )

            if all_done:
                break

            # Check timeout
            elapsed = (datetime.now() - start_time).total_seconds()
            if elapsed > timeout:
                raise TimeoutError(f"Subagents did not complete within {timeout}s")

            # Wait before checking again
            await asyncio.sleep(0.5)

        # Collect all results
        return await self.collect_outputs(subtask_ids)

    async def get_statistics(self) -> dict[str, Any]:
        """Get statistics about subagent executions.

        Returns:
            Statistics dict
        """
        by_status = {}
        by_type = {}

        for tracking in self._active_subagents.values():
            status = tracking["status"]
            by_status[status] = by_status.get(status, 0) + 1

            agent_type = tracking["config"].agent_type
            by_type[agent_type] = by_type.get(agent_type, 0) + 1

        return {
            "total_active": len(self._active_subagents),
            "by_status": by_status,
            "by_type": by_type
        }
