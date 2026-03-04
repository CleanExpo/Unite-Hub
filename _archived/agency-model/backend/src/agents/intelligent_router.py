"""Intelligent Router - ML-based task routing to best-suited agents.

Routes tasks to agents based on:
- Historical performance
- Task complexity analysis
- Agent specialization matching
- Success rate predictions
"""

from typing import Any

from pydantic import BaseModel

from src.memory.models import MemoryDomain
from src.memory.store import MemoryStore
from src.utils import get_logger

logger = get_logger(__name__)


class TaskAnalysis(BaseModel):
    """Analysis of a task for routing."""

    task_id: str
    description: str
    category: str  # frontend, backend, database, etc.
    complexity: str  # simple, moderate, complex
    estimated_duration: float  # seconds
    required_skills: list[str]
    similar_past_tasks: list[str]  # IDs of similar tasks


class AgentChoice(BaseModel):
    """Recommended agent for a task."""

    agent_type: str
    confidence: float  # 0-1
    reasoning: list[str]
    past_success_rate: float
    estimated_iterations: int


class Complexity(str):
    """Task complexity levels."""

    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class Approach(BaseModel):
    """Recommended approach for a task."""

    approach_name: str
    description: str
    steps: list[str]
    tools_needed: list[str]
    estimated_success_probability: float


class IntelligentRouter:
    """Routes tasks to best-suited agents based on historical performance."""

    def __init__(self, memory_store: MemoryStore | None = None) -> None:
        """Initialize intelligent router.

        Args:
            memory_store: Optional memory store
        """
        self.memory_store = memory_store or MemoryStore()

    async def analyze_task(
        self,
        description: str
    ) -> TaskAnalysis:
        """Analyze task to inform routing decision.

        Args:
            description: Task description

        Returns:
            Task analysis
        """
        logger.info("Analyzing task for routing", task=description[:100])

        # Categorize task
        category = self._categorize_task(description)

        # Estimate complexity
        complexity = await self._estimate_complexity(description)

        # Find similar past tasks
        similar_tasks = await self._find_similar_tasks(description)

        # Extract required skills
        required_skills = self._extract_required_skills(description, category)

        # Estimate duration based on similar tasks
        estimated_duration = await self._estimate_duration(similar_tasks)

        analysis = TaskAnalysis(
            task_id=f"task_analysis_{hash(description) % 10000}",
            description=description,
            category=category,
            complexity=complexity,
            estimated_duration=estimated_duration,
            required_skills=required_skills,
            similar_past_tasks=[t.get("id", "") for t in similar_tasks]
        )

        logger.info(
            "Task analyzed",
            category=category,
            complexity=complexity,
            similar_tasks=len(similar_tasks)
        )

        return analysis

    def _categorize_task(self, description: str) -> str:
        """Categorize task by primary domain."""
        desc_lower = description.lower()

        categories_keywords = {
            "frontend": ["ui", "component", "page", "react", "nextjs", "tailwind"],
            "backend": ["api", "endpoint", "service", "fastapi", "agent"],
            "database": ["migration", "schema", "query", "supabase", "sql"],
            "testing": ["test", "coverage", "e2e"],
            "documentation": ["docs", "readme", "documentation"],
            "refactoring": ["refactor", "improve", "cleanup", "optimize"],
            "bug": ["fix", "bug", "error", "issue", "crash"]
        }

        for category, keywords in categories_keywords.items():
            if any(kw in desc_lower for kw in keywords):
                return category

        return "general"

    async def _estimate_complexity(self, description: str) -> str:
        """Estimate task complexity."""
        desc_lower = description.lower()

        # Simple indicators
        simple_indicators = ["add button", "fix typo", "update text", "change color"]
        complex_indicators = ["implement", "design", "architect", "migrate", "refactor entire"]

        if any(ind in desc_lower for ind in simple_indicators):
            return Complexity.SIMPLE

        if any(ind in desc_lower for ind in complex_indicators):
            return Complexity.COMPLEX

        # Check word count as proxy for complexity
        word_count = len(description.split())
        if word_count < 10:
            return Complexity.SIMPLE
        elif word_count > 30:
            return Complexity.COMPLEX

        return Complexity.MODERATE

    async def _find_similar_tasks(self, description: str) -> list[dict[str, Any]]:
        """Find similar past tasks using vector search."""
        try:
            await self.memory_store.initialize()

            similar = await self.memory_store.retrieve_relevant_context(
                task_description=description,
                domain=MemoryDomain.KNOWLEDGE,
                limit=5
            )

            return similar

        except Exception as e:
            logger.warning(f"Could not find similar tasks: {e}")
            return []

    def _extract_required_skills(self, description: str, category: str) -> list[str]:
        """Extract required skills from task."""
        skill_mapping = {
            "frontend": ["NEXTJS.md", "COMPONENTS.md", "TAILWIND.md"],
            "backend": ["FASTAPI.md", "LANGGRAPH.md", "AGENTS.md"],
            "database": ["SUPABASE.md", "MIGRATIONS.md"],
            "testing": ["TESTING.md"],
            "bug": ["BUG_FIXING.md"],
            "refactoring": ["REFACTORING.md"]
        }

        # Always include core skills
        skills = ["VERIFICATION.md", "SELF_CORRECTION.md"]

        # Add category-specific skills
        skills.extend(skill_mapping.get(category, []))

        return skills

    async def _estimate_duration(self, similar_tasks: list[dict[str, Any]]) -> float:
        """Estimate duration based on similar tasks."""
        if not similar_tasks:
            return 300.0  # Default: 5 minutes

        # Extract durations from similar tasks
        durations = [
            t.get("duration_seconds", 300.0)
            for t in similar_tasks
            if "duration_seconds" in t
        ]

        if durations:
            # Return median duration
            sorted_durations = sorted(durations)
            median_idx = len(sorted_durations) // 2
            return sorted_durations[median_idx]

        return 300.0

    async def predict_best_agent(
        self,
        task: TaskAnalysis
    ) -> AgentChoice:
        """Predict best agent for a task.

        Args:
            task: Task analysis

        Returns:
            Agent choice with confidence and reasoning
        """
        logger.info("Predicting best agent", task_category=task.category)

        # Get historical performance by agent type
        agent_performance = await self._get_agent_performance_history(task.category)

        # Find agent with best success rate for this category
        best_agent_type = max(
            agent_performance.items(),
            key=lambda x: x[1]["success_rate"],
            default=(task.category, {"success_rate": 0.0})
        )[0]

        performance = agent_performance.get(best_agent_type, {})
        success_rate = performance.get("success_rate", 0.5)

        # Calculate confidence
        confidence = self._calculate_confidence(task, performance)

        # Generate reasoning
        reasoning = [
            f"{best_agent_type} agent has {success_rate * 100:.1f}% success rate for {task.category} tasks",
            f"Task complexity: {task.complexity}",
            f"Similar tasks found: {len(task.similar_past_tasks)}"
        ]

        if confidence > 0.8:
            reasoning.append("High confidence based on strong historical performance")
        elif confidence < 0.5:
            reasoning.append("Lower confidence - consider human review")

        # Estimate iterations
        avg_iterations = performance.get("avg_iterations", 1.5)

        choice = AgentChoice(
            agent_type=best_agent_type,
            confidence=confidence,
            reasoning=reasoning,
            past_success_rate=success_rate,
            estimated_iterations=int(avg_iterations + 0.5)
        )

        logger.info(
            "Agent predicted",
            agent_type=best_agent_type,
            confidence=confidence
        )

        return choice

    async def _get_agent_performance_history(
        self,
        category: str
    ) -> dict[str, dict[str, Any]]:
        """Get historical performance by agent type."""
        # Placeholder - would query agent_runs table
        # Group by agent_type, calculate success rates
        return {
            "frontend": {"success_rate": 0.85, "avg_iterations": 1.2},
            "backend": {"success_rate": 0.90, "avg_iterations": 1.1},
            "database": {"success_rate": 0.95, "avg_iterations": 1.0}
        }

    def _calculate_confidence(
        self,
        task: TaskAnalysis,
        performance: dict[str, Any]
    ) -> float:
        """Calculate confidence in routing decision."""
        confidence = 0.5  # Base confidence

        # Boost if high success rate
        success_rate = performance.get("success_rate", 0.5)
        confidence += success_rate * 0.3

        # Boost if similar tasks found
        if len(task.similar_past_tasks) > 3:
            confidence += 0.15

        # Reduce for complex tasks
        if task.complexity == Complexity.COMPLEX:
            confidence -= 0.1

        # Clamp to 0-1
        return max(0.0, min(1.0, confidence))

    async def estimate_complexity(
        self,
        task: dict[str, Any]
    ) -> str:
        """Estimate task complexity.

        Args:
            task: Task dict

        Returns:
            Complexity level (simple, moderate, complex)
        """
        description = task.get("description", "")
        return await self._estimate_complexity(description)

    async def recommend_approach(
        self,
        task: dict[str, Any]
    ) -> Approach:
        """Recommend approach for a task based on past successes.

        Args:
            task: Task dict

        Returns:
            Recommended approach
        """
        description = task.get("description", "")

        logger.info("Recommending approach", task=description[:100])

        # Find successful past approaches for similar tasks
        similar_successes = await self._find_similar_successful_approaches(description)

        if similar_successes:
            # Use most successful approach
            best_approach = similar_successes[0]

            return Approach(
                approach_name=best_approach.get("approach_name", "TDD"),
                description=best_approach.get("description", "Test-driven development"),
                steps=best_approach.get("steps", []),
                tools_needed=best_approach.get("tools_used", []),
                estimated_success_probability=0.85
            )

        # Default approach
        return Approach(
            approach_name="Standard TDD",
            description="Test-driven development with iterative improvement",
            steps=[
                "Write failing test",
                "Implement minimal code to pass",
                "Refactor for quality",
                "Verify independently"
            ],
            tools_needed=["test_runner", "code_editor"],
            estimated_success_probability=0.75
        )

    async def _find_similar_successful_approaches(
        self,
        description: str
    ) -> list[dict[str, Any]]:
        """Find successful approaches for similar tasks."""
        try:
            await self.memory_store.initialize()

            patterns = await self.memory_store.get_successful_patterns()

            # Filter for similar task patterns
            # Placeholder - would use vector search
            return [p.value for p in patterns[:3]]

        except Exception as e:
            logger.warning(f"Could not find successful approaches: {e}")
            return []
