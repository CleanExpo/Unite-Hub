"""Marketing agents for copywriting and business consistency.

These agents handle:
- Research-driven copywriting (audience research, competitor analysis, copy generation)
- Business consistency (NAP management, citation audits, schema generation, GEO optimization)

INTEGRITY REQUIREMENTS (Non-negotiable for Copywriting):
- 100% UNIQUE: No copied content from any source
- ZERO PLAGIARISM: Not even close paraphrasing
- 100% VERIFIABLE: Every claim must have documented evidence
"""

import uuid
from typing import Any

from src.utils import get_logger

from .base_agent import BaseAgent

logger = get_logger(__name__)


class CopywritingAgent(BaseAgent):
    """Agent for research-driven copywriting tasks.

    Handles:
    - Audience research (Voice of Customer extraction)
    - Competitor analysis (page structure breakdowns)
    - Copy generation (conversion-focused, using customer language)
    - Copy validation (integrity, uniqueness, verifiability)

    CRITICAL: All copy must be:
    - 100% original (plagiarism check required)
    - Fully verifiable (evidence for every claim)
    - Customer-voice inspired (not copied)
    """

    def __init__(self) -> None:
        super().__init__(
            name="copywriting",
            capabilities=[
                "copywriting",
                "website copy",
                "landing page",
                "sales copy",
                "headline",
                "value proposition",
                "call to action",
                "CTA",
                "conversion copy",
                "voice of customer",
                "audience research",
                "competitor analysis",
                "homepage copy",
                "services page",
                "about page",
            ],
        )

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a copywriting task.

        Args:
            task_description: Description of the copywriting task
            context: Additional context including:
                - business_id: ID of the business
                - page_type: Type of page (homepage, services, etc.)
                - research_data: Audience research quotes
                - competitor_data: Competitor analysis
                - brand_guidelines: Voice and tone rules

        Returns:
            Task output with generated copy and integrity results
        """
        task_id = f"copywriting_{uuid.uuid4().hex[:8]}"
        self.start_task(task_id)

        self.logger.info(
            "Executing copywriting task",
            task=task_description,
            context_keys=list(context.keys()) if context else [],
        )

        # Determine subtask type
        task_lower = task_description.lower()

        if "research" in task_lower or "audience" in task_lower:
            subtask = "audience_research"
            self.add_completion_criterion(
                criterion_type="data_collection",
                target="audience_research",
                expected="quotes_collected",
            )
        elif "competitor" in task_lower:
            subtask = "competitor_analysis"
            self.add_completion_criterion(
                criterion_type="data_collection",
                target="competitor_analysis",
                expected="pages_analyzed",
            )
        elif "validate" in task_lower or "check" in task_lower:
            subtask = "copy_validation"
            self.add_completion_criterion(
                criterion_type="validation",
                target="copy_integrity",
                expected="integrity_passed",
            )
        else:
            subtask = "copy_generation"
            # All copy must be verified for integrity
            self.add_completion_criterion(
                criterion_type="integrity_check",
                target="copy_content",
                expected="plagiarism_free",
            )
            self.add_completion_criterion(
                criterion_type="integrity_check",
                target="copy_claims",
                expected="all_verifiable",
            )

        # Report the output type
        self.report_output(
            output_type="content",
            path=f"copywriting/{subtask}",
            description=f"Copywriting {subtask} for: {task_description[:50]}",
        )

        result = {
            "status": "pending_verification",
            "task": task_description,
            "subtask": subtask,
            "integrity_requirements": {
                "uniqueness": "100% original content required",
                "plagiarism": "Zero tolerance - check before publish",
                "verifiability": "Every claim must have evidence",
            },
        }

        return {
            **result,
            "task_output": self.get_task_output().model_dump(),
        }


class BusinessConsistencyAgent(BaseAgent):
    """Agent for business consistency and local SEO tasks.

    Handles:
    - NAP (Name, Address, Phone) consistency management
    - Platform listing tracking and auditing
    - Schema markup generation (LocalBusiness, Organization)
    - GEO optimization for AI search visibility
    - Citation management across directories

    Key principle: Single source of truth for all business data.
    """

    def __init__(self) -> None:
        super().__init__(
            name="business_consistency",
            capabilities=[
                "NAP consistency",
                "local SEO",
                "business listing",
                "Google Business Profile",
                "GBP",
                "citation",
                "schema markup",
                "LocalBusiness",
                "directory listing",
                "Apple Maps",
                "Bing Places",
                "GEO optimization",
                "AI search",
                "voice search",
            ],
        )

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a business consistency task.

        Args:
            task_description: Description of the consistency task
            context: Additional context including:
                - business_id: ID of the business
                - master_document: Single source of truth data
                - platforms: Platforms to audit/update
                - schema_type: Type of schema to generate

        Returns:
            Task output with consistency results
        """
        task_id = f"consistency_{uuid.uuid4().hex[:8]}"
        self.start_task(task_id)

        self.logger.info(
            "Executing business consistency task",
            task=task_description,
            context_keys=list(context.keys()) if context else [],
        )

        # Determine subtask type
        task_lower = task_description.lower()

        if "audit" in task_lower:
            subtask = "consistency_audit"
            self.add_completion_criterion(
                criterion_type="audit",
                target="nap_consistency",
                expected="score_calculated",
            )
        elif "schema" in task_lower:
            subtask = "schema_generation"
            self.add_completion_criterion(
                criterion_type="validation",
                target="schema_markup",
                expected="valid_json_ld",
            )
        elif "listing" in task_lower or "platform" in task_lower:
            subtask = "platform_management"
            self.add_completion_criterion(
                criterion_type="data_sync",
                target="platform_listings",
                expected="nap_matched",
            )
        elif "geo" in task_lower or "ai" in task_lower:
            subtask = "geo_optimization"
            self.add_completion_criterion(
                criterion_type="optimization",
                target="ai_visibility",
                expected="content_structured",
            )
        else:
            subtask = "nap_management"
            self.add_completion_criterion(
                criterion_type="data_integrity",
                target="master_document",
                expected="single_source_of_truth",
            )

        # Report the output type
        self.report_output(
            output_type="data",
            path=f"consistency/{subtask}",
            description=f"Business consistency {subtask} for: {task_description[:50]}",
        )

        result = {
            "status": "pending_verification",
            "task": task_description,
            "subtask": subtask,
            "consistency_requirements": {
                "nap": "EXACTLY identical across all platforms",
                "schema": "Valid JSON-LD, zero errors",
                "platforms": "100% Tier 1-2 coverage required",
            },
        }

        return {
            **result,
            "task_output": self.get_task_output().model_dump(),
        }
