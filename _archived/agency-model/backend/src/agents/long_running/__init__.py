"""Long-Running Agent Harness.

Enables agents to work effectively across many context windows by:
1. Setting up structured environment on first run (InitializerAgent)
2. Making incremental progress each session (CodingAgent)
3. Tracking progress with structured files (ProgressTracker)
4. Managing feature requirements (FeatureManager)

Reference: Anthropic Blog - "Effective harnesses for long-running agents"
https://www.anthropic.com/research/long-running-agents

Key Concepts:
- Each session starts by reading progress files and git history
- Work on ONE feature at a time
- Test features end-to-end before marking complete
- Leave environment in clean state with documentation

Usage:
    from src.agents.long_running import (
        LongRunningAgentHarness,
        SessionRunner,
    )

    # Option 1: Use the harness directly
    harness = LongRunningAgentHarness(
        project_path="/path/to/project",
        project_name="my-app",
        specification="Build a chat application",
    )
    result = await harness.run_session()

    # Option 2: Use SessionRunner for simpler API
    runner = SessionRunner("/path/to/project")
    result = await runner.run("Build a chat application")

    # Option 3: Run until complete (with caution!)
    results = await harness.run_until_complete(max_sessions=50)
"""

from .coding_agent import (
    CodingAgent,
    CodingConfig,
    CodingSessionResult,
    FeatureWorkResult,
    SessionRunner,
)
from .features import (
    Feature,
    FeatureCategory,
    FeatureList,
    FeatureManager,
    FeaturePriority,
    generate_features_from_spec,
    load_features_from_prd_json,
)
from .harness import (
    HarnessConfig,
    HarnessState,
    LongRunningAgentHarness,
    SessionResult,
    run_long_running_project,
)
from .initializer import (
    InitializerAgent,
    InitializerConfig,
    InitializerResult,
    check_if_initialized,
)
from .progress import (
    ProgressFile,
    ProgressTracker,
    SessionProgress,
    create_init_script,
)

__all__ = [
    # Progress tracking
    "ProgressTracker",
    "SessionProgress",
    "ProgressFile",
    "create_init_script",
    # Feature management
    "FeatureManager",
    "FeatureList",
    "Feature",
    "FeatureCategory",
    "FeaturePriority",
    "generate_features_from_spec",
    "load_features_from_prd_json",
    # Initializer agent
    "InitializerAgent",
    "InitializerConfig",
    "InitializerResult",
    "check_if_initialized",
    # Coding agent
    "CodingAgent",
    "CodingConfig",
    "CodingSessionResult",
    "FeatureWorkResult",
    "SessionRunner",
    # Harness
    "LongRunningAgentHarness",
    "HarnessConfig",
    "HarnessState",
    "SessionResult",
    "run_long_running_project",
]
