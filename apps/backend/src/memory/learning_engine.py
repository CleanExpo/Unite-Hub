"""Learning Engine - Enables agents to learn and improve over time.

Implements:
- Pattern extraction from successes
- Failure cause analysis
- Agent prompt evolution
- Verification criteria improvement
- A/B testing for approaches
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from src.memory.models import MemoryDomain
from src.memory.store import MemoryStore
from src.utils import get_logger

logger = get_logger(__name__)


class LearningInsight(BaseModel):
    """An insight learned from task execution."""

    insight_id: str
    insight_type: str  # pattern, antipattern, optimization, verification_criterion
    description: str
    evidence: list[str]
    confidence: float  # 0-1
    applicability: list[str]  # Categories this applies to


class PromptEvolution(BaseModel):
    """Evolution recommendation for agent prompts."""

    target_agent: str
    current_performance: float
    suggested_changes: list[str]
    expected_improvement: float
    test_results: dict[str, Any] | None = None


class LearningEngine:
    """Enables agents to learn and improve over time."""

    def __init__(self, memory_store: MemoryStore | None = None) -> None:
        """Initialize learning engine.

        Args:
            memory_store: Optional memory store
        """
        self.memory_store = memory_store or MemoryStore()

    async def extract_patterns_from_success(
        self,
        task_id: str
    ) -> list[LearningInsight]:
        """Extract reusable patterns from successful task execution.

        Args:
            task_id: ID of successful task

        Returns:
            List of extracted insights
        """
        logger.info("Extracting patterns from success", task_id=task_id)

        insights = []

        # Get task details from memory/database
        task_details = await self._get_task_details(task_id)

        if not task_details:
            logger.warning("Task details not found", task_id=task_id)
            return insights

        # Extract what worked
        approach_used = task_details.get("approach")
        tools_used = task_details.get("tools_used", [])
        duration = task_details.get("duration_seconds", 0)
        iterations = task_details.get("iterations", 1)

        # If completed on first attempt with good approach, it's a pattern
        if iterations == 1 and approach_used:
            insights.append(LearningInsight(
                insight_id=f"pattern_{task_id}_{datetime.now().timestamp()}",
                insight_type="pattern",
                description=f"Approach '{approach_used}' succeeded on first attempt",
                evidence=[
                    f"Task: {task_details.get('description', '')}",
                    f"Tools: {', '.join(tools_used)}",
                    f"Duration: {duration}s"
                ],
                confidence=0.9,
                applicability=[task_details.get("category", "general")]
            ))

        # If specific tools led to success, record that
        if tools_used:
            insights.append(LearningInsight(
                insight_id=f"tools_{task_id}",
                insight_type="optimization",
                description=f"Tools {', '.join(tools_used)} effective for this task type",
                evidence=["Successful completion with these tools"],
                confidence=0.75,
                applicability=[task_details.get("category", "general")]
            ))

        # Store insights to memory
        for insight in insights:
            await self._store_insight(insight)

        logger.info(
            "Patterns extracted",
            task_id=task_id,
            insights_count=len(insights)
        )

        return insights

    async def analyze_failure_causes(
        self,
        task_id: str
    ) -> list[LearningInsight]:
        """Analyze why a task failed to avoid repeating mistakes.

        Args:
            task_id: ID of failed task

        Returns:
            List of failure insights
        """
        logger.info("Analyzing failure causes", task_id=task_id)

        insights = []

        # Get failure details
        task_details = await self._get_task_details(task_id)

        if not task_details:
            logger.warning("Task details not found", task_id=task_id)
            return insights

        failure_type = task_details.get("failure_type")
        error_message = task_details.get("error_message", "")
        attempts = task_details.get("attempts", 1)

        # Extract failure pattern
        if failure_type:
            insights.append(LearningInsight(
                insight_id=f"antipattern_{task_id}",
                insight_type="antipattern",
                description=f"Approach failed with {failure_type} after {attempts} attempts",
                evidence=[
                    f"Error: {error_message}",
                    f"Attempted approach: {task_details.get('approach', 'unknown')}",
                    f"Attempts: {attempts}"
                ],
                confidence=0.8,
                applicability=[task_details.get("category", "general")]
            ))

        # Store to memory as failure pattern
        for insight in insights:
            await self._store_failure_insight(insight)

        logger.info(
            "Failure analyzed",
            task_id=task_id,
            insights_count=len(insights)
        )

        return insights

    async def update_agent_prompts(
        self,
        learnings: dict[str, list[LearningInsight]]
    ) -> list[PromptEvolution]:
        """Update agent prompts based on learnings.

        Args:
            learnings: Dict mapping agent_type to insights

        Returns:
            List of prompt evolution recommendations
        """
        logger.info("Updating agent prompts from learnings")

        evolutions = []

        for agent_type, insights in learnings.items():
            # Analyze insights for this agent
            patterns_learned = [i for i in insights if i.insight_type == "pattern"]
            antipatterns_found = [i for i in insights if i.insight_type == "antipattern"]

            if patterns_learned or antipatterns_found:
                # Generate prompt evolution recommendation
                suggested_changes = []

                for pattern in patterns_learned:
                    suggested_changes.append(
                        f"Add to best practices: {pattern.description}"
                    )

                for antipattern in antipatterns_found:
                    suggested_changes.append(
                        f"Add to warnings: Avoid {antipattern.description}"
                    )

                evolution = PromptEvolution(
                    target_agent=agent_type,
                    current_performance=await self._get_agent_performance(agent_type),
                    suggested_changes=suggested_changes,
                    expected_improvement=0.05  # Estimated 5% improvement
                )

                evolutions.append(evolution)

        logger.info(
            "Prompt evolutions generated",
            count=len(evolutions)
        )

        return evolutions

    async def _get_agent_performance(self, agent_type: str) -> float:
        """Get current performance metric for agent."""
        # Placeholder - would query agent_runs table
        return 0.85  # Default 85% success rate

    async def evolve_verification_criteria(
        self,
        feedback: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Evolve verification criteria based on feedback.

        Args:
            feedback: List of verification feedback

        Returns:
            Updated verification criteria
        """
        logger.info("Evolving verification criteria", feedback_count=len(feedback))

        # Analyze which criteria catch issues vs create false positives
        criteria_effectiveness = {}

        for fb in feedback:
            criterion = fb.get("criterion_type")
            caught_real_issue = fb.get("caught_real_issue", False)

            if criterion not in criteria_effectiveness:
                criteria_effectiveness[criterion] = {
                    "catches": 0,
                    "false_positives": 0
                }

            if caught_real_issue:
                criteria_effectiveness[criterion]["catches"] += 1
            else:
                criteria_effectiveness[criterion]["false_positives"] += 1

        # Recommend keeping criteria with high catch rate, low false positive rate
        recommendations = {
            "keep_criteria": [],
            "remove_criteria": [],
            "add_criteria": []
        }

        for criterion, stats in criteria_effectiveness.items():
            total = stats["catches"] + stats["false_positives"]
            if total == 0:
                continue

            effectiveness = stats["catches"] / total

            if effectiveness > 0.7:
                recommendations["keep_criteria"].append(criterion)
            elif effectiveness < 0.3:
                recommendations["remove_criteria"].append(
                    f"{criterion} (too many false positives)"
                )

        logger.info(
            "Verification criteria evolved",
            keep=len(recommendations["keep_criteria"]),
            remove=len(recommendations["remove_criteria"])
        )

        return recommendations

    async def _get_task_details(self, task_id: str) -> dict[str, Any] | None:
        """Get task details from memory/database."""
        # Placeholder - would query agent_runs or task history
        return None

    async def _store_insight(self, insight: LearningInsight) -> None:
        """Store learning insight to memory."""
        try:
            await self.memory_store.initialize()

            await self.memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="insights",
                key=insight.insight_id,
                value=insight.model_dump(),
                source="learning_engine",
                tags=["insight", insight.insight_type],
                generate_embedding=True
            )

            logger.debug("Insight stored", insight_id=insight.insight_id)

        except Exception as e:
            logger.error(f"Failed to store insight: {e}")

    async def _store_failure_insight(self, insight: LearningInsight) -> None:
        """Store failure insight to memory."""
        try:
            await self.memory_store.initialize()

            await self.memory_store.store_failure(
                failure_type=insight.description,
                context=insight.model_dump()
            )

            logger.debug("Failure insight stored", insight_id=insight.insight_id)

        except Exception as e:
            logger.error(f"Failed to store failure insight: {e}")
