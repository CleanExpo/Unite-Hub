"""
Orchestrator Agent - Python/LangGraph implementation

UPDATED: Now uses IndependentVerifier for all verification.
Agents can NO LONGER verify their own work - the orchestrator
routes verification to the IndependentVerifier agent.

KEY CHANGES:
- Removed calls to agent.verify_build(), verify_tests(), verify_functionality()
- Added verification gate using IndependentVerifier
- Tasks cannot be marked complete without passing verification
- Escalation to human review after 3 failed verification attempts

ADVANCED TOOL USE:
- Tool Search Tool: Dynamic tool discovery (85% context reduction)
- Programmatic Tool Calling: Code execution for orchestration (37% token reduction)
- Tool Use Examples: Improved parameter accuracy (72% → 90%)

LONG-RUNNING AGENT HARNESS:
- InitializerAgent: Sets up environment on first run
- CodingAgent: Makes incremental progress each session
- ProgressTracker: Maintains session-by-session notes
- FeatureManager: Tracks feature completion with JSON file
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from src.agents.long_running import (
    HarnessConfig,
    LongRunningAgentHarness,
    SessionRunner,
    check_if_initialized,
)
from src.agents.subagent_manager import (
    SubagentConfig,
    SubagentManager,
    SubagentResult,
    SubTask,
)
from src.tools import (
    ToolRegistry,
)
from src.tools.programmatic import ProgrammaticToolCaller
from src.tools.search import ToolSearcher
from src.utils import get_logger
from src.verification import (
    ClaimedOutput,
    CompletionCriterion,
    IndependentVerifier,
    VerificationRequest,
    VerificationType,
)
from src.verification import (
    VerificationResult as IndependentVerificationResult,
)

from .base_agent import BaseAgent, TaskOutput
from .registry import AgentRegistry

logger = get_logger(__name__)


# ============================================================================
# Task Status - Updated with verification states
# ============================================================================


class TaskStatus(str, Enum):
    """Status of a task."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_VERIFICATION = "awaiting_verification"
    VERIFICATION_IN_PROGRESS = "verification_in_progress"
    VERIFICATION_PASSED = "verification_passed"
    VERIFICATION_FAILED = "verification_failed"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ESCALATED_TO_HUMAN = "escalated_to_human"


# ============================================================================
# Task State Models
# ============================================================================


class VerificationAttempt(BaseModel):
    """Record of a verification attempt."""

    attempt_number: int
    timestamp: str
    verifier_id: str
    passed: bool
    evidence_count: int
    failures: list[str] = Field(default_factory=list)


class TaskState(BaseModel):
    """State of a task being processed."""

    task_id: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: str | None = None
    assigned_agent_id: str | None = None
    attempts: int = 0
    max_attempts: int = 3
    verification_attempts: list[VerificationAttempt] = Field(default_factory=list)
    latest_verification: IndependentVerificationResult | None = None
    task_output: TaskOutput | None = None
    error_history: list[str] = Field(default_factory=list)
    result: Any = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: str | None = None


class ToolContext(BaseModel):
    """Context for advanced tool use tracking."""

    loaded_tools: list[str] = Field(default_factory=list)
    searched_tools: list[str] = Field(default_factory=list)
    programmatic_calls: int = 0
    context_tokens_saved: int = 0


class OrchestratorState(BaseModel):
    """State managed by the orchestrator."""

    current_task: TaskState | None = None
    completed_tasks: list[TaskState] = Field(default_factory=list)
    failed_tasks: list[TaskState] = Field(default_factory=list)
    escalated_tasks: list[TaskState] = Field(default_factory=list)
    context: dict[str, Any] = Field(default_factory=dict)
    tool_context: ToolContext = Field(default_factory=ToolContext)


# ============================================================================
# Orchestrator Agent
# ============================================================================


class OrchestratorAgent(BaseAgent):
    """
    Master orchestrator that:
    1. Routes tasks to appropriate agents
    2. Enforces INDEPENDENT verification (not self-attestation)
    3. Maintains honest status reporting
    4. Handles escalation after verification failures

    ADVANCED TOOL USE FEATURES:
    5. Tool Search Tool: Dynamic discovery of relevant tools (85% context reduction)
    6. Programmatic Tool Calling: Code execution for tool orchestration
    7. Tool Use Examples: Improved parameter accuracy

    CRITICAL: Uses IndependentVerifier for ALL verification.
    Agents cannot verify their own work.
    """

    # Beta header for advanced tool use
    BETA_HEADER = "advanced-tool-use-2025-11-20"

    def __init__(self) -> None:
        super().__init__(
            name="orchestrator",
            capabilities=["orchestrate", "route", "manage", "coordinate"],
        )
        self.registry = AgentRegistry()
        self.verifier = IndependentVerifier()

        # Initialize advanced tool use components
        self.tool_registry = self._initialize_tool_registry()
        self.tool_searcher = ToolSearcher(self.tool_registry)
        self.programmatic_caller = ProgrammaticToolCaller(self.tool_registry)

        # Initialize subagent manager (Phase 2.1)
        self.subagent_manager = SubagentManager(self.registry)

        logger.info(
            "Orchestrator initialized with advanced tool use and subagent coordination",
            tool_stats=self.tool_registry.get_context_stats(),
        )

    def _initialize_tool_registry(self) -> ToolRegistry:
        """Initialize and register all tools."""
        from src.tools.definitions import register_all_tools
        return register_all_tools()

    # =========================================================================
    # Advanced Tool Use Methods
    # =========================================================================

    def get_api_tools(self, include_deferred: bool = False) -> list[dict[str, Any]]:
        """Get tools in Claude API format.

        Uses deferred loading by default for 85% context reduction.

        Args:
            include_deferred: If True, includes full definitions for deferred tools

        Returns:
            List of tool definitions ready for Claude API
        """
        return self.tool_registry.to_api_format(
            include_search_tool=True,
            include_code_execution=True,
            include_deferred=include_deferred,
        )

    def get_beta_header(self) -> str:
        """Get beta header for advanced tool use API requests."""
        return self.BETA_HEADER

    def search_tools(
        self,
        query: str,
        limit: int = 5,
        category: str | None = None,
    ) -> list[dict[str, Any]]:
        """Search for tools matching a query.

        Uses the Tool Search Tool for dynamic discovery.

        Args:
            query: Natural language search query
            limit: Maximum number of results
            category: Optional category filter

        Returns:
            List of matching tools with scores
        """
        results = self.tool_searcher.search(
            query=query,
            limit=limit,
            strategy="combined",
            category=category,
        )

        # Track searched tools
        for result in results:
            self.tool_registry.record_usage(result.name)

        return [
            {
                "name": r.name,
                "description": r.description,
                "score": r.score,
                "categories": r.categories,
                "keywords": r.keywords,
            }
            for r in results
        ]

    def load_tool(self, name: str) -> dict[str, Any] | None:
        """Load a deferred tool by name.

        Called when Claude uses Tool Search to find a tool,
        then needs the full definition to use it.

        Args:
            name: Name of the tool to load

        Returns:
            Full tool definition or None if not found
        """
        tool = self.tool_registry.load(name)
        if tool:
            return tool.to_api_format()
        return None

    def create_execution_context(self) -> Any:
        """Create a new programmatic tool execution context.

        Used when Claude sends code execution that invokes tools.
        """
        return self.programmatic_caller.create_context()

    async def execute_programmatic_calls(
        self,
        context: Any,
    ) -> list[dict[str, Any]]:
        """Execute pending tool calls from code execution.

        Args:
            context: Execution context with pending calls

        Returns:
            List of tool results
        """
        return await self.programmatic_caller.execute_pending_calls(context)

    def get_context_stats(self) -> dict[str, Any]:
        """Get context usage statistics.

        Returns:
            Statistics about tool loading and context savings
        """
        tool_stats = self.tool_registry.get_context_stats()
        programmatic_stats = self.programmatic_caller.get_context_savings()

        return {
            **tool_stats,
            **programmatic_stats,
            "beta_header": self.BETA_HEADER,
        }

    # =========================================================================
    # Long-Running Agent Harness Methods
    # =========================================================================

    def create_long_running_harness(
        self,
        project_path: str,
        project_name: str,
        specification: str,
        config: dict[str, Any] | None = None,
    ) -> LongRunningAgentHarness:
        """Create a harness for a long-running project.

        Use this for complex projects that span multiple context windows.

        Args:
            project_path: Root path for the project
            project_name: Name of the project
            specification: High-level project specification
            config: Optional configuration overrides

        Returns:
            Configured LongRunningAgentHarness

        Example:
            harness = orchestrator.create_long_running_harness(
                project_path="/projects/chat-app",
                project_name="chat-app",
                specification="Build a clone of claude.ai",
            )
            result = await harness.run_session()
        """
        harness_config = HarnessConfig(
            project_path=project_path,
            project_name=project_name,
            specification=specification,
            **(config or {}),
        )

        return LongRunningAgentHarness(
            project_path=project_path,
            project_name=project_name,
            specification=specification,
            config=harness_config,
        )

    async def run_long_running_session(
        self,
        project_path: str,
        project_name: str,
        specification: str | None = None,
    ) -> dict[str, Any]:
        """Run a single session for a long-running project.

        Automatically detects if initialization or coding is needed.

        Args:
            project_path: Root path for the project
            project_name: Name of the project
            specification: Required for first run (initialization)

        Returns:
            Session result with progress information
        """
        runner = SessionRunner(project_path, project_name)
        return await runner.run(specification)

    def is_project_initialized(self, project_path: str) -> bool:
        """Check if a project has been initialized for long-running work.

        Args:
            project_path: Path to check

        Returns:
            True if claude-progress.txt exists
        """
        return check_if_initialized(project_path)

    def get_project_progress(self, project_path: str) -> str:
        """Get progress summary for a long-running project.

        Args:
            project_path: Path to the project

        Returns:
            Human-readable progress summary
        """
        runner = SessionRunner(project_path)
        return runner.get_progress()

    # =========================================================================
    # Subagent Coordination Methods (Phase 2.1)
    # =========================================================================

    async def spawn_subagent(
        self,
        agent_type: str,
        subtask: SubTask,
        context_partition: dict[str, Any] | None = None
    ) -> BaseAgent:
        """Spawn a specialized subagent for a subtask.

        Args:
            agent_type: Type of agent to spawn (frontend, backend, database, etc.)
            subtask: The subtask to execute
            context_partition: Partitioned context (only relevant data)

        Returns:
            Spawned agent instance
        """
        config = SubagentConfig(
            agent_type=agent_type,
            task=subtask,
            context_partition=context_partition or {}
        )

        agents = await self.subagent_manager.launch([config])

        if not agents:
            raise RuntimeError(f"Failed to spawn {agent_type} subagent")

        logger.info(
            "Subagent spawned",
            agent_type=agent_type,
            subtask_id=subtask.subtask_id,
            agent_id=agents[0].get_agent_id()
        )

        return agents[0]

    async def coordinate_parallel(
        self,
        subtasks: list[SubTask]
    ) -> list[SubagentResult]:
        """Execute multiple subtasks in parallel with dependency resolution.

        Args:
            subtasks: List of subtasks to execute

        Returns:
            List of subagent results
        """
        logger.info(
            "Coordinating parallel execution",
            subtask_count=len(subtasks)
        )

        # Create configs for all subtasks
        configs = [
            SubagentConfig(
                agent_type=subtask.agent_type,
                task=subtask,
                context_partition=self._partition_context_for_subagent(subtask)
            )
            for subtask in subtasks
        ]

        # Execute in parallel with dependency resolution
        results = await self.subagent_manager.execute_parallel(configs)

        # Handle failures
        failed_results = [r for r in results if r.status == "failed"]
        if failed_results:
            failure_analysis = await self.subagent_manager.handle_failures(failed_results)
            logger.warning(
                "Some subagents failed",
                failed_count=len(failed_results),
                analysis=failure_analysis
            )

        logger.info(
            "Parallel coordination complete",
            total=len(results),
            successful=sum(1 for r in results if r.status == "completed")
        )

        return results

    async def merge_results(
        self,
        results: list[SubagentResult]
    ) -> dict[str, Any]:
        """Merge results from multiple subagents.

        Args:
            results: Results from subagents

        Returns:
            Merged result combining all subagent outputs
        """
        merged = {
            "subtask_results": [],
            "combined_outputs": [],
            "all_completion_criteria": [],
            "total_duration": 0.0,
            "all_successful": True
        }

        for result in results:
            merged["subtask_results"].append({
                "subtask_id": result.subtask_id,
                "agent_type": result.agent_type,
                "status": result.status,
                "duration": result.duration_seconds
            })

            if result.status != "completed":
                merged["all_successful"] = False

            if result.task_output:
                merged["combined_outputs"].extend(result.task_output.outputs)
                merged["all_completion_criteria"].extend(
                    result.task_output.completion_criteria
                )

            if result.duration_seconds:
                merged["total_duration"] += result.duration_seconds

        logger.info(
            "Results merged",
            subtasks=len(results),
            total_outputs=len(merged["combined_outputs"]),
            all_successful=merged["all_successful"]
        )

        return merged

    async def resolve_conflicts(
        self,
        conflicting_results: list[SubagentResult]
    ) -> dict[str, Any]:
        """Resolve conflicts between subagent results.

        For example, if multiple agents modified the same file.

        Args:
            conflicting_results: Results that conflict

        Returns:
            Resolution with chosen approach
        """
        resolution = {
            "conflicts_detected": len(conflicting_results),
            "resolved_by": "priority",  # Could be: priority, merge, manual, etc.
            "chosen_result": None,
            "reasoning": []
        }

        if not conflicting_results:
            return resolution

        # Simple resolution: Choose by priority
        # (Could be enhanced with more sophisticated strategies)
        sorted_by_priority = sorted(
            conflicting_results,
            key=lambda r: r.status == "completed",  # Successful first
            reverse=True
        )

        resolution["chosen_result"] = sorted_by_priority[0]
        resolution["reasoning"].append(
            "Chose successful result over failed results"
        )

        logger.info(
            "Conflicts resolved",
            conflicts=len(conflicting_results),
            chosen=sorted_by_priority[0].subtask_id
        )

        return resolution

    def _partition_context_for_subagent(
        self,
        subtask: SubTask
    ) -> dict[str, Any]:
        """Partition context to give subagent only relevant data.

        This prevents context window bloat by loading only what each agent needs.

        Args:
            subtask: The subtask to partition context for

        Returns:
            Partitioned context dict
        """
        # Simple partitioning by agent type
        partitions = {
            "frontend": {
                "relevant_paths": ["apps/web/**/*.tsx", "apps/web/**/*.ts"],
                "skills": ["NEXTJS.md", "COMPONENTS.md", "TAILWIND.md"],
                "memory_domain": "frontend"
            },
            "backend": {
                "relevant_paths": ["apps/backend/src/**/*.py"],
                "skills": ["FASTAPI.md", "LANGGRAPH.md", "AGENTS.md"],
                "memory_domain": "backend"
            },
            "database": {
                "relevant_paths": ["supabase/migrations/**/*.sql"],
                "skills": ["SUPABASE.md", "MIGRATIONS.md"],
                "memory_domain": "database"
            },
            "test": {
                "relevant_paths": ["tests/**/*.py", "**/*.test.ts"],
                "skills": ["TESTING.md"],
                "memory_domain": "testing"
            },
            "review": {
                "relevant_paths": ["**/*"],  # Review needs broader view
                "skills": ["CODE_REVIEW.md"],
                "memory_domain": "knowledge"
            }
        }

        partition = partitions.get(subtask.agent_type, {})

        context = {
            "subtask": subtask.model_dump(),
            "relevant_paths": partition.get("relevant_paths", []),
            "skills_to_load": partition.get("skills", []),
            "memory_domain": partition.get("memory_domain"),
            **subtask.context  # Include subtask-specific context
        }

        logger.debug(
            "Context partitioned for subagent",
            agent_type=subtask.agent_type,
            context_keys=list(context.keys())
        )

        return context

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute the orchestrator on a task."""
        return await self.run(task_description, context)

    async def run(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Run the orchestrator on a task."""
        task_id = f"task_{hash(task_description) % 10000}_{datetime.now().strftime('%H%M%S')}"

        state = OrchestratorState(
            current_task=TaskState(
                task_id=task_id,
                description=task_description,
            ),
            context=context or {},
        )

        logger.info(
            "Orchestrator starting task",
            task_id=task_id,
            description=task_description[:100],
        )

        # Execute the orchestration workflow
        state = await self._route_task(state)

        if state.current_task and state.current_task.status != TaskStatus.BLOCKED:
            # Execute and verify loop
            while (
                state.current_task
                and state.current_task.attempts < state.current_task.max_attempts
                and state.current_task.status not in [
                    TaskStatus.COMPLETED,
                    TaskStatus.ESCALATED_TO_HUMAN,
                ]
            ):
                # Execute the task
                state = await self._execute_task(state)

                # If execution succeeded, run independent verification
                if state.current_task.status == TaskStatus.AWAITING_VERIFICATION:
                    state = await self._verify_task_independently(state)

                    if state.current_task.status == TaskStatus.VERIFICATION_PASSED:
                        # Verification passed - task is complete
                        state.current_task.status = TaskStatus.COMPLETED
                        state.current_task.completed_at = datetime.now().isoformat()
                        state = self._complete_task(state)
                        break

                    elif state.current_task.status == TaskStatus.VERIFICATION_FAILED:
                        # Verification failed - handle failure and potentially retry
                        state = await self._handle_verification_failure(state)

                        # Check if we should escalate
                        if state.current_task.attempts >= state.current_task.max_attempts:
                            state = self._escalate_to_human(state)
                            break

            # Handle final state
            if (
                state.current_task
                and state.current_task.status == TaskStatus.FAILED
            ):
                state.failed_tasks.append(state.current_task)
                state.current_task = None

        return self._build_result(state, task_id)

    async def _route_task(self, state: OrchestratorState) -> OrchestratorState:
        """Route task to appropriate agent based on task type."""
        if not state.current_task:
            return state

        task = state.current_task
        category = self._categorize_task(task.description)
        agent = self.registry.get_agent_for_category(category)

        if agent:
            task.assigned_agent = agent.name
            task.assigned_agent_id = agent.get_agent_id()
            task.status = TaskStatus.IN_PROGRESS
            logger.info(
                "Routed task to agent",
                task_id=task.task_id,
                agent=agent.name,
                agent_id=task.assigned_agent_id,
                category=category,
            )
        else:
            task.status = TaskStatus.BLOCKED
            task.error_history.append(f"No agent found for category: {category}")
            logger.warning("No agent found for task", category=category)

        return state

    async def _execute_task(self, state: OrchestratorState) -> OrchestratorState:
        """Execute the task using assigned agent."""
        if not state.current_task or not state.current_task.assigned_agent:
            return state

        task = state.current_task
        task.attempts += 1

        agent = self.registry.get_agent(task.assigned_agent)
        if not agent:
            task.status = TaskStatus.FAILED
            task.error_history.append(f"Agent not found: {task.assigned_agent}")
            return state

        try:
            result = await agent.execute(task.description, state.context)
            task.result = result

            # Extract task output for verification
            if isinstance(result, dict) and "task_output" in result:
                task.task_output = TaskOutput(**result["task_output"])

            # Move to awaiting verification - NOT complete
            task.status = TaskStatus.AWAITING_VERIFICATION
            logger.info(
                "Task execution completed, awaiting verification",
                task_id=task.task_id,
                attempt=task.attempts,
            )
        except Exception as e:
            task.error_history.append(f"Execution error: {str(e)}")
            task.status = TaskStatus.FAILED
            logger.error(
                "Task execution failed",
                task_id=task.task_id,
                error=str(e),
            )

        return state

    async def _verify_task_independently(
        self, state: OrchestratorState
    ) -> OrchestratorState:
        """
        CRITICAL: Verify task using IndependentVerifier.

        This is the verification gate - no task can be marked complete
        without passing independent verification.

        The verifier:
        1. Is a DIFFERENT agent from the one that did the work
        2. Performs ACTUAL checks (file exists, tests pass, etc.)
        3. Collects EVIDENCE for every verification
        4. Returns verified=True ONLY with proof
        """
        if not state.current_task:
            return state

        task = state.current_task
        task.status = TaskStatus.VERIFICATION_IN_PROGRESS

        logger.info(
            "Starting independent verification",
            task_id=task.task_id,
            verifier_id=self.verifier.get_verifier_id(),
            agent_id=task.assigned_agent_id,
        )

        # Build verification request from task output
        claimed_outputs: list[ClaimedOutput] = []
        completion_criteria: list[CompletionCriterion] = []

        if task.task_output:
            for output in task.task_output.outputs:
                claimed_outputs.append(
                    ClaimedOutput(
                        type=output.get("type", "other"),
                        path=output.get("path", ""),
                        description=output.get("description", ""),
                    )
                )

            for criterion in task.task_output.completion_criteria:
                try:
                    criterion_type = VerificationType(criterion.get("type", "file_exists"))
                except ValueError:
                    criterion_type = VerificationType.FILE_EXISTS

                completion_criteria.append(
                    CompletionCriterion(
                        type=criterion_type,
                        target=criterion.get("target", ""),
                        expected=criterion.get("expected"),
                        threshold=criterion.get("threshold"),
                    )
                )

        # If no criteria specified, add default file checks for any claimed outputs
        if not completion_criteria and claimed_outputs:
            for output in claimed_outputs:
                if output.type == "file":
                    completion_criteria.extend([
                        CompletionCriterion(
                            type=VerificationType.FILE_EXISTS,
                            target=output.path,
                        ),
                        CompletionCriterion(
                            type=VerificationType.FILE_NOT_EMPTY,
                            target=output.path,
                        ),
                        CompletionCriterion(
                            type=VerificationType.NO_PLACEHOLDERS,
                            target=output.path,
                        ),
                    ])

        # Perform independent verification
        try:
            verification = await self.verifier.verify(
                VerificationRequest(
                    task_id=task.task_id,
                    claimed_outputs=claimed_outputs,
                    completion_criteria=completion_criteria,
                    requesting_agent_id=task.assigned_agent_id or "unknown",
                )
            )

            task.latest_verification = verification

            # Record verification attempt
            task.verification_attempts.append(
                VerificationAttempt(
                    attempt_number=len(task.verification_attempts) + 1,
                    timestamp=datetime.now().isoformat(),
                    verifier_id=verification.verifier_id,
                    passed=verification.verified,
                    evidence_count=len(verification.evidence),
                    failures=[f.reason for f in verification.failures],
                )
            )

            if verification.verified:
                task.status = TaskStatus.VERIFICATION_PASSED
                logger.info(
                    "Verification PASSED",
                    task_id=task.task_id,
                    verifier_id=verification.verifier_id,
                    evidence_count=verification.passed_checks,
                )
            else:
                task.status = TaskStatus.VERIFICATION_FAILED
                task.error_history.append(
                    f"Verification failed: {[f.reason for f in verification.failures]}"
                )
                logger.warning(
                    "Verification FAILED",
                    task_id=task.task_id,
                    failures=[f.reason for f in verification.failures],
                )

        except Exception as e:
            task.status = TaskStatus.VERIFICATION_FAILED
            task.error_history.append(f"Verification error: {str(e)}")
            logger.error(
                "Verification error",
                task_id=task.task_id,
                error=str(e),
            )

        return state

    async def _handle_verification_failure(
        self, state: OrchestratorState
    ) -> OrchestratorState:
        """
        Handle verification failure with honest reporting.

        No sugar-coating. No "almost working".
        State clearly what failed and why.
        """
        if not state.current_task:
            return state

        task = state.current_task
        failure_report = self._generate_failure_report(task)
        task.error_history.append(failure_report)

        logger.warning(
            "Handling verification failure",
            task_id=task.task_id,
            attempt=task.attempts,
            max_attempts=task.max_attempts,
            remaining=task.max_attempts - task.attempts,
        )

        # Reset status for retry if attempts remaining
        if task.attempts < task.max_attempts:
            task.status = TaskStatus.IN_PROGRESS
        else:
            task.status = TaskStatus.FAILED

        return state

    def _escalate_to_human(self, state: OrchestratorState) -> OrchestratorState:
        """Escalate task to human review after max verification failures."""
        if not state.current_task:
            return state

        task = state.current_task
        task.status = TaskStatus.ESCALATED_TO_HUMAN

        logger.warning(
            "ESCALATING TO HUMAN REVIEW",
            task_id=task.task_id,
            attempts=task.attempts,
            verification_attempts=len(task.verification_attempts),
            reason="Max verification attempts exceeded",
        )

        state.escalated_tasks.append(task)
        state.current_task = None

        return state

    def _complete_task(self, state: OrchestratorState) -> OrchestratorState:
        """Mark task as complete and move to completed list."""
        if state.current_task:
            state.completed_tasks.append(state.current_task)
            state.current_task = None
        return state

    def _categorize_task(self, description: str) -> str:
        """Categorize task based on description."""
        description_lower = description.lower()

        keywords = {
            "frontend": ["frontend", "component", "ui", "page", "next", "react", "css", "tailwind"],
            "backend": ["backend", "api", "agent", "langgraph", "python", "fastapi"],
            "database": ["database", "migration", "supabase", "sql", "query", "schema"],
            "devops": ["deploy", "docker", "ci", "cd", "devops", "infrastructure"],
        }

        for category, words in keywords.items():
            if any(word in description_lower for word in words):
                return category

        return "general"

    def _generate_failure_report(self, task: TaskState) -> str:
        """Generate honest failure report."""
        report = f"""
## Verification Failed: {task.description}

### Attempt: {task.attempts}/{task.max_attempts}

### Latest Verification:
"""
        if task.latest_verification:
            report += f"- Verifier ID: {task.latest_verification.verifier_id}\n"
            report += f"- Passed: {task.latest_verification.passed_checks}/{task.latest_verification.total_checks}\n"
            report += f"- Failed: {task.latest_verification.failed_checks}\n"

            if task.latest_verification.failures:
                report += "\n### Failures:\n"
                for failure in task.latest_verification.failures:
                    report += f"- {failure.criterion}: {failure.reason}\n"
                    report += f"  Expected: {failure.expected}\n"
                    report += f"  Actual: {failure.actual}\n"

        if task.error_history:
            report += "\n### Error History (last 3):\n"
            for error in task.error_history[-3:]:
                report += f"- {error[:200]}\n"

        return report

    def _build_result(self, state: OrchestratorState, task_id: str) -> dict[str, Any]:
        """Build the final result dictionary."""
        # Get context statistics
        context_stats = self.get_context_stats()

        return {
            "task_id": task_id,
            "completed": len(state.completed_tasks),
            "failed": len(state.failed_tasks),
            "escalated": len(state.escalated_tasks),
            "verification_enforced": True,
            "verifier_id": self.verifier.get_verifier_id(),
            "tasks": {
                "completed": [
                    {
                        "task_id": t.task_id,
                        "description": t.description,
                        "status": t.status.value,
                        "verification_attempts": len(t.verification_attempts),
                        "completed_at": t.completed_at,
                    }
                    for t in state.completed_tasks
                ],
                "failed": [
                    {
                        "task_id": t.task_id,
                        "description": t.description,
                        "status": t.status.value,
                        "attempts": t.attempts,
                        "error_history": t.error_history[-3:],
                    }
                    for t in state.failed_tasks
                ],
                "escalated": [
                    {
                        "task_id": t.task_id,
                        "description": t.description,
                        "status": t.status.value,
                        "attempts": t.attempts,
                        "requires_human_review": True,
                    }
                    for t in state.escalated_tasks
                ],
            },
            # Advanced tool use statistics
            "advanced_tool_use": {
                "beta_header": context_stats.get("beta_header"),
                "total_tools": context_stats.get("total_tools", 0),
                "loaded_tools": context_stats.get("loaded_tools", 0),
                "deferred_tools": context_stats.get("deferred_tools", 0),
                "estimated_tokens_saved": context_stats.get("estimated_saved_tokens", 0),
                "context_reduction_percent": context_stats.get("context_reduction_percent", 0),
                "programmatic_calls": context_stats.get("total_programmatic_calls", 0),
                "tool_context": {
                    "loaded": state.tool_context.loaded_tools,
                    "searched": state.tool_context.searched_tools,
                    "calls": state.tool_context.programmatic_calls,
                    "tokens_saved": state.tool_context.context_tokens_saved,
                },
            },
        }
