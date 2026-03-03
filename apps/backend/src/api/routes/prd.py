"""PRD Generation API Routes.

Endpoints for generating Product Requirement Documents using AI agents.
"""

from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, Field

from src.agents.prd import PRDOrchestrator
from src.api.error_handling import create_error_response
from src.state.events import AgentEventPublisher
from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/prd", tags=["prd"])


class GeneratePRDRequest(BaseModel):
    """Request to generate PRD."""

    requirements: str = Field(
        description="User requirements (free text)",
        min_length=10
    )
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context (target_users, timeline, team_size, etc.)"
    )
    output_dir: str | None = Field(
        default=None,
        description="Directory to save PRD documents (optional)"
    )
    user_id: str | None = Field(
        default=None,
        description="User ID for tracking"
    )


class GeneratePRDResponse(BaseModel):
    """Response from PRD generation request."""

    prd_id: str = Field(description="PRD generation ID")
    task_id: str = Field(description="Task ID")
    run_id: str = Field(description="Agent run ID for real-time tracking")
    status: str = Field(description="pending | in_progress | completed | failed")
    message: str = Field(description="Status message")


class PRDStatusResponse(BaseModel):
    """PRD generation status response."""

    prd_id: str
    status: str
    progress_percent: float
    current_step: str | None
    result: dict[str, Any] | None
    error: str | None


@router.post("/generate", response_model=GeneratePRDResponse)
async def generate_prd(
    prd_request: GeneratePRDRequest,
    background_tasks: BackgroundTasks,
    request: Request = None,
) -> GeneratePRDResponse:
    """Generate comprehensive PRD from requirements.

    This endpoint triggers the PRD generation process which runs in the background.
    Use the returned run_id to track progress via real-time updates or polling.

    **Process**:
    1. PRD Analysis - Analyzes requirements
    2. Feature Decomposition - Creates user stories
    3. Technical Specification - Designs architecture
    4. Test Plan Generation - Creates test scenarios
    5. Roadmap Planning - Plans sprints and timeline

    **Outputs** (if output_dir specified):
    - prd.md - Product requirements document
    - user_stories.md - User stories with acceptance criteria
    - feature_list.json - Feature list for InitializerAgent
    - tech_spec.md - Technical specification
    - test_plan.md - Test plan
    - roadmap.md - Implementation roadmap

    **Example**:
    ```json
    {
      "requirements": "Build a task management app for remote teams...",
      "context": {
        "target_users": "Remote teams",
        "timeline": "3 months",
        "team_size": 2
      },
      "output_dir": "./workspace/my-project"
    }
    ```
    """
    try:
        # Create unique PRD ID
        from datetime import datetime
        prd_id = f"prd_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Initialize event publisher for real-time updates
        publisher = AgentEventPublisher()

        # Start agent run tracking
        run_id = await publisher.start_run(
            task_id=prd_id,
            user_id=prd_request.user_id,
            agent_name="prd_orchestrator",
        )

        logger.info(
            "PRD generation request received",
            prd_id=prd_id,
            run_id=run_id,
            requirements_length=len(prd_request.requirements),
        )

        # Execute PRD generation in background
        background_tasks.add_task(
            execute_prd_generation,
            prd_id=prd_id,
            run_id=run_id,
            requirements=prd_request.requirements,
            context=prd_request.context,
            output_dir=prd_request.output_dir,
            publisher=publisher,
        )

        return GeneratePRDResponse(
            prd_id=prd_id,
            task_id=prd_id,
            run_id=run_id,
            status="pending",
            message=f"PRD generation started. Track progress with run_id: {run_id}"
        )

    except Exception as e:
        logger.error("Failed to start PRD generation", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to start PRD generation",
            error_code="PRD_GENERATION_ERROR",
        )


@router.get("/status/{run_id}", response_model=PRDStatusResponse)
async def get_prd_status(request: Request, run_id: str) -> PRDStatusResponse:
    """Get PRD generation status by run ID.

    Use this endpoint to poll for status if not using real-time updates.

    **Returns**:
    - Status: pending, in_progress, completed, failed
    - Progress percentage (0-100)
    - Current step
    - Result (if completed)
    - Error (if failed)
    """
    try:
        from src.state.supabase import SupabaseStateStore

        store = SupabaseStateStore()
        run = await store.get_agent_run(run_id)

        if not run:
            raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")

        # Parse result if available
        result = None
        if run["status"] == "completed" and run.get("metadata"):
            result = run["metadata"].get("prd_result")

        return PRDStatusResponse(
            prd_id=run["task_id"],
            status=run["status"],
            progress_percent=run.get("progress_percent", 0.0),
            current_step=run.get("current_step"),
            result=result,
            error=run.get("error"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get PRD status", run_id=run_id, error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to get PRD status",
            error_code="GET_PRD_STATUS_FAILED",
        )


@router.get("/result/{prd_id}")
async def get_prd_result(request: Request, prd_id: str) -> dict[str, Any]:
    """Get complete PRD result by PRD ID.

    Returns the full PRD generation result including all analysis,
    user stories, technical spec, test plan, and roadmap.
    """
    try:
        # In production, you'd store PRD results in database
        # For now, we'll get it from agent run metadata
        from src.state.supabase import SupabaseStateStore

        store = SupabaseStateStore()
        runs = await store.get_task_agent_runs(prd_id)

        if not runs:
            raise HTTPException(status_code=404, detail=f"PRD not found: {prd_id}")

        # Get the most recent completed run
        completed_run = next(
            (r for r in runs if r["status"] == "completed"),
            None
        )

        if not completed_run:
            raise HTTPException(
                status_code=400,
                detail=f"PRD generation not completed yet: {prd_id}"
            )

        result = completed_run.get("metadata", {}).get("prd_result")

        if not result:
            raise HTTPException(
                status_code=500,
                detail="PRD result not found in metadata"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get PRD result", prd_id=prd_id, error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to get PRD result",
            error_code="GET_PRD_RESULT_FAILED",
        )


@router.get("/documents/{prd_id}")
async def list_prd_documents(request: Request, prd_id: str) -> dict[str, Any]:
    """List generated PRD documents.

    Returns paths to all generated document files if output_dir was specified.
    """
    try:
        result = await get_prd_result(request, prd_id)

        documents = result.get("documents_generated", [])

        return {
            "prd_id": prd_id,
            "documents": documents,
            "count": len(documents),
        }

    except Exception as e:
        logger.error("Failed to list PRD documents", prd_id=prd_id, error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to list PRD documents",
            error_code="LIST_PRD_DOCUMENTS_FAILED",
        )


# Background task function
async def execute_prd_generation(
    prd_id: str,
    run_id: str,
    requirements: str,
    context: dict[str, Any],
    output_dir: str | None,
    publisher: AgentEventPublisher,
) -> None:
    """Execute PRD generation in background with progress updates."""
    try:
        # Update to in_progress
        await publisher.update_status(run_id, "in_progress", "Starting PRD generation")

        # Initialize orchestrator
        orchestrator = PRDOrchestrator()

        # Phase tracking

        # We can't easily hook into orchestrator phases, so we'll just update progress
        # In a production system, you'd modify orchestrator to emit progress events

        # Generate PRD
        await publisher.update_progress(
            run_id,
            step="Starting PRD generation pipeline",
            progress=10.0
        )

        result = await orchestrator.generate(
            requirements=requirements,
            context=context,
            output_dir=output_dir,
        )

        if result["success"]:
            # Store result in metadata for retrieval
            from src.state.supabase import SupabaseStateStore
            store = SupabaseStateStore()

            await store.update_agent_run(
                run_id=run_id,
                status="completed",
                progress_percent=100.0,
                metadata={"prd_result": result["prd_result"]},
            )

            await publisher.complete_run(
                run_id,
                result={
                    "prd_id": prd_id,
                    "total_user_stories": result["prd_result"]["total_user_stories"],
                    "total_api_endpoints": result["prd_result"]["total_api_endpoints"],
                    "total_test_scenarios": result["prd_result"]["total_test_scenarios"],
                    "total_sprints": result["prd_result"]["total_sprints"],
                    "estimated_duration_weeks": result["prd_result"]["estimated_duration_weeks"],
                    "documents_generated": result["prd_result"]["documents_generated"],
                }
            )

            logger.info(
                "PRD generation completed",
                prd_id=prd_id,
                run_id=run_id,
                user_stories=result["prd_result"]["total_user_stories"],
                duration_weeks=result["prd_result"]["estimated_duration_weeks"],
            )

        else:
            # Generation failed
            await publisher.fail_run(
                run_id,
                error=result.get("error", "Unknown error"),
                details={"prd_id": prd_id}
            )

            logger.error(
                "PRD generation failed",
                prd_id=prd_id,
                run_id=run_id,
                error=result.get("error"),
            )

    except Exception as e:
        logger.error(
            "PRD generation exception",
            prd_id=prd_id,
            run_id=run_id,
            error=str(e),
        )

        await publisher.fail_run(
            run_id,
            error=str(e),
            details={"prd_id": prd_id}
        )
