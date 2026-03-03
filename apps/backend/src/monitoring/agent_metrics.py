"""Agent Metrics - Track agent performance and reliability.

Tracks:
- Task execution metrics
- Verification pass rates
- PR success rates
- Iteration counts
- Performance trends
- Cost tracking
"""

from datetime import datetime, timedelta
from typing import Any

from pydantic import BaseModel

from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

logger = get_logger(__name__)


class TaskMetrics(BaseModel):
    """Metrics for a single task execution."""

    task_id: str
    agent_id: str
    agent_type: str
    started_at: str
    completed_at: str | None = None
    duration_seconds: float | None = None
    iterations: int = 1
    verification_attempts: int = 1
    verified: bool = False
    pr_created: bool = False
    pr_merged: bool = False
    cost_estimate: float = 0.0


class AgentHealthReport(BaseModel):
    """Health report for an agent."""

    agent_id: str
    agent_type: str
    total_tasks: int
    successful_tasks: int
    failed_tasks: int
    success_rate: float
    avg_iterations: float
    avg_duration_seconds: float
    verification_pass_rate: float
    pr_merge_rate: float
    last_active: str | None = None


class AgentMetrics:
    """Track agent performance and reliability."""

    def __init__(self) -> None:
        """Initialize agent metrics."""
        self.store = SupabaseStateStore()
        self.client = self.store.client

    async def track_task_execution(
        self,
        task_id: str,
        agent_id: str,
        agent_type: str,
        metrics: dict[str, Any]
    ) -> None:
        """Track metrics for a task execution.

        Args:
            task_id: Task identifier
            agent_id: Agent identifier
            agent_type: Type of agent
            metrics: Metrics dict
        """
        task_metrics = TaskMetrics(
            task_id=task_id,
            agent_id=agent_id,
            agent_type=agent_type,
            started_at=metrics.get("started_at", datetime.now().isoformat()),
            completed_at=metrics.get("completed_at"),
            duration_seconds=metrics.get("duration_seconds"),
            iterations=metrics.get("iterations", 1),
            verification_attempts=metrics.get("verification_attempts", 1),
            verified=metrics.get("verified", False),
            pr_created=metrics.get("pr_created", False),
            pr_merged=metrics.get("pr_merged", False),
            cost_estimate=metrics.get("cost_estimate", 0.0)
        )

        # Store to database (could use a dedicated metrics table)
        await self._store_metrics(task_metrics)

        logger.info(
            "Task metrics tracked",
            task_id=task_id,
            agent_type=agent_type,
            verified=task_metrics.verified
        )

    async def _store_metrics(self, metrics: TaskMetrics) -> None:
        """Store metrics to database."""
        # Use agent_runs table or create dedicated metrics table
        self.client.table("agent_runs").upsert(
            {
                "id": metrics.task_id,
                "agent_type": metrics.agent_type,
                "status": "completed" if metrics.verified else "failed",
                "metadata": metrics.model_dump()
            },
            on_conflict="id"
        ).execute()

    async def track_verification_rate(
        self,
        agent_id: str,
        passed: bool
    ) -> float:
        """Track verification pass rate for an agent.

        Args:
            agent_id: Agent identifier
            passed: Whether verification passed

        Returns:
            Current verification pass rate
        """
        # Query past verifications
        results = self.client.table("agent_runs").select("metadata").eq(
            "metadata->>agent_id", agent_id
        ).execute()

        total = len(results.data)
        if total == 0:
            return 1.0 if passed else 0.0

        passed_count = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("verified", False)
        )

        pass_rate = passed_count / total

        logger.debug(
            "Verification rate tracked",
            agent_id=agent_id,
            pass_rate=pass_rate,
            total=total
        )

        return pass_rate

    async def track_pr_success_rate(
        self,
        agent_type: str,
        merged: bool
    ) -> float:
        """Track PR merge success rate by agent type.

        Args:
            agent_type: Type of agent
            merged: Whether PR was merged

        Returns:
            Current PR merge rate for this agent type
        """
        # Query past PRs for this agent type
        results = self.client.table("agent_runs").select("metadata").eq(
            "agent_type", agent_type
        ).execute()

        prs_created = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("pr_created", False)
        )

        if prs_created == 0:
            return 1.0 if merged else 0.0

        prs_merged = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("pr_merged", False)
        )

        merge_rate = prs_merged / prs_created

        logger.debug(
            "PR success rate tracked",
            agent_type=agent_type,
            merge_rate=merge_rate
        )

        return merge_rate

    async def track_iteration_count(
        self,
        task_id: str,
        iterations: int
    ) -> dict[str, float]:
        """Track iteration count for a task.

        Args:
            task_id: Task identifier
            iterations: Number of iterations needed

        Returns:
            Statistics about iteration counts
        """
        # Store iteration count
        self.client.table("agent_runs").update(
            {"metadata": {"iterations": iterations}}
        ).eq("id", task_id).execute()

        # Get average iterations across all tasks
        results = self.client.table("agent_runs").select("metadata").execute()

        all_iterations = [
            r.get("metadata", {}).get("iterations", 1)
            for r in results.data
        ]

        avg_iterations = sum(all_iterations) / len(all_iterations) if all_iterations else 1.0

        return {
            "current_iterations": iterations,
            "avg_iterations": avg_iterations,
            "min_iterations": min(all_iterations) if all_iterations else 1,
            "max_iterations": max(all_iterations) if all_iterations else 1
        }

    async def get_agent_health(
        self,
        agent_id: str
    ) -> AgentHealthReport:
        """Get comprehensive health report for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Health report with statistics
        """
        # Query all tasks for this agent
        results = self.client.table("agent_runs").select("*").eq(
            "metadata->>agent_id", agent_id
        ).execute()

        if not results.data:
            return AgentHealthReport(
                agent_id=agent_id,
                agent_type="unknown",
                total_tasks=0,
                successful_tasks=0,
                failed_tasks=0,
                success_rate=0.0,
                avg_iterations=0.0,
                avg_duration_seconds=0.0,
                verification_pass_rate=0.0,
                pr_merge_rate=0.0
            )

        # Calculate metrics
        total_tasks = len(results.data)
        successful_tasks = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("verified", False)
        )
        failed_tasks = total_tasks - successful_tasks

        iterations = [
            r.get("metadata", {}).get("iterations", 1)
            for r in results.data
        ]
        avg_iterations = sum(iterations) / len(iterations) if iterations else 0.0

        durations = [
            r.get("metadata", {}).get("duration_seconds", 0)
            for r in results.data
            if r.get("metadata", {}).get("duration_seconds")
        ]
        avg_duration = sum(durations) / len(durations) if durations else 0.0

        verification_attempts = [
            r.get("metadata", {}).get("verification_attempts", 1)
            for r in results.data
        ]
        verified_count = successful_tasks
        verification_pass_rate = (
            verified_count / sum(verification_attempts)
            if verification_attempts
            else 0.0
        )

        prs_created = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("pr_created", False)
        )
        prs_merged = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("pr_merged", False)
        )
        pr_merge_rate = prs_merged / prs_created if prs_created > 0 else 0.0

        # Get last active timestamp
        last_active = max(
            (r.get("created_at") for r in results.data),
            default=None
        )

        # Get agent type from first result
        agent_type = results.data[0].get("agent_type", "unknown")

        report = AgentHealthReport(
            agent_id=agent_id,
            agent_type=agent_type,
            total_tasks=total_tasks,
            successful_tasks=successful_tasks,
            failed_tasks=failed_tasks,
            success_rate=successful_tasks / total_tasks,
            avg_iterations=avg_iterations,
            avg_duration_seconds=avg_duration,
            verification_pass_rate=verification_pass_rate,
            pr_merge_rate=pr_merge_rate,
            last_active=last_active
        )

        logger.info(
            "Agent health report generated",
            agent_id=agent_id,
            success_rate=report.success_rate
        )

        return report

    async def get_overall_statistics(
        self,
        time_range_days: int = 7
    ) -> dict[str, Any]:
        """Get overall statistics across all agents.

        Args:
            time_range_days: Number of days to include

        Returns:
            Statistics dict
        """
        since = (datetime.now() - timedelta(days=time_range_days)).isoformat()

        results = self.client.table("agent_runs").select("*").gte(
            "created_at", since
        ).execute()

        if not results.data:
            return {
                "time_range_days": time_range_days,
                "total_tasks": 0,
                "successful_tasks": 0,
                "failed_tasks": 0
            }

        total = len(results.data)
        successful = sum(
            1 for r in results.data
            if r.get("metadata", {}).get("verified", False)
        )
        failed = total - successful

        # Group by agent type
        by_type: dict[str, Any] = {}
        for result in results.data:
            agent_type = result.get("agent_type", "unknown")
            if agent_type not in by_type:
                by_type[agent_type] = {"total": 0, "successful": 0, "failed": 0}

            by_type[agent_type]["total"] += 1
            if result.get("metadata", {}).get("verified", False):
                by_type[agent_type]["successful"] += 1
            else:
                by_type[agent_type]["failed"] += 1

        return {
            "time_range_days": time_range_days,
            "total_tasks": total,
            "successful_tasks": successful,
            "failed_tasks": failed,
            "success_rate": successful / total if total > 0 else 0.0,
            "by_agent_type": by_type,
            "metrics_as_of": datetime.now().isoformat()
        }
