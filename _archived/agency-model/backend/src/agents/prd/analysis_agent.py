"""PRD Analysis Agent - Analyzes requirements and generates structured PRD.

This agent is the foundation of the PRD system. It takes high-level user
requirements and produces a comprehensive, structured Product Requirement Document.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field

from src.config import get_settings
from src.utils import get_logger

from ..base_agent import BaseAgent

settings = get_settings()
logger = get_logger(__name__)


class PRDAnalysis(BaseModel):
    """Structured PRD analysis output."""

    executive_summary: str = Field(description="2-3 sentence project summary")
    problem_statement: str = Field(description="What user pain are we solving?")
    target_users: list[str] = Field(description="User personas/segments")
    success_metrics: list[str] = Field(description="Quantifiable success criteria")
    functional_requirements: list[str] = Field(description="What the system must do")
    non_functional_requirements: list[str] = Field(
        description="Quality attributes (performance, security, etc.)"
    )
    constraints: list[str] = Field(description="Limitations and boundaries")
    assumptions: list[str] = Field(description="Things we're assuming to be true")
    out_of_scope: list[str] = Field(description="Explicitly not included")

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class PRDAnalysisAgent(BaseAgent):
    """Agent that analyzes requirements and generates structured PRD.

    This agent uses Claude Opus for deep analysis of user requirements,
    extracting structured information needed for a comprehensive PRD.

    Usage:
        agent = PRDAnalysisAgent()
        result = await agent.execute(
            task_description="Build a chat app with AI...",
            context={
                "target_users": "Developers",
                "timeline": "3 months",
                "team_size": 2,
            }
        )

        analysis = PRDAnalysis(**result["analysis"])
    """

    def __init__(self) -> None:
        super().__init__(
            name="prd_analysis",
            capabilities=[
                "requirements_analysis",
                "prd_generation",
                "stakeholder_analysis",
                "scope_definition",
            ],
        )
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Analyze requirements and generate PRD structure.

        Args:
            task_description: User requirements (free text)
            context: Additional context (target_users, timeline, etc.)

        Returns:
            Dictionary with PRDAnalysis and metadata
        """
        context = context or {}
        task_id = f"prd_analysis_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        self.logger.info(
            "Starting PRD analysis",
            requirements_length=len(task_description),
            context_keys=list(context.keys()),
        )

        try:
            # Generate the PRD analysis using Claude Opus
            analysis = await self._analyze_requirements(task_description, context)

            # Report outputs for verification
            self.report_output("prd_analysis", "analysis", "Structured PRD analysis")

            self.logger.info(
                "PRD analysis completed",
                functional_reqs=len(analysis.functional_requirements),
                non_functional_reqs=len(analysis.non_functional_requirements),
                target_users=len(analysis.target_users),
            )

            return {
                "success": True,
                "analysis": analysis.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("PRD analysis failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _analyze_requirements(
        self,
        requirements: str,
        context: dict[str, Any],
    ) -> PRDAnalysis:
        """Use Claude Opus to analyze requirements and extract structure."""

        # Build the analysis prompt
        prompt = self._build_analysis_prompt(requirements, context)

        # Call Claude Opus for deep analysis
        response = await self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=4000,
            temperature=0.3,  # Lower temperature for structured output
            system=self._get_system_prompt(),
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        # Extract and parse the response
        content = response.content[0].text

        # Claude should return JSON, but wrap in try/catch
        try:
            # Try to extract JSON from the response
            json_start = content.find("{")
            json_end = content.rfind("}") + 1

            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                analysis_data = json.loads(json_str)
                return PRDAnalysis(**analysis_data)
            else:
                # Fallback: parse markdown structure
                return self._parse_markdown_response(content)

        except Exception as e:
            self.logger.warning("Failed to parse JSON, using fallback", error=str(e))
            return self._parse_markdown_response(content)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for PRD analysis."""
        return """You are an expert senior product manager and requirements analyst.

Your role is to analyze user requirements and produce comprehensive, structured Product Requirement Documents (PRDs).

Guidelines:
1. Be thorough and detailed in your analysis
2. Extract ALL implicit requirements from the user's description
3. Identify potential edge cases and considerations
4. Think about the complete user journey
5. Consider non-functional requirements (performance, security, scalability)
6. Be realistic about scope and constraints
7. Output MUST be valid JSON matching the expected schema

Always think about:
- Who are the users and what are their goals?
- What problem are we solving and why does it matter?
- How will we measure success?
- What are the technical and business constraints?
- What should explicitly NOT be included (to prevent scope creep)?
"""

    def _build_analysis_prompt(
        self,
        requirements: str,
        context: dict[str, Any],
    ) -> str:
        """Build the analysis prompt with requirements and context."""

        context_str = ""
        if context:
            context_str = "\n\nAdditional Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        return f"""Analyze the following product requirements and generate a comprehensive PRD structure.

User Requirements:
{requirements}
{context_str}

Please provide a detailed analysis in the following JSON format:

{{
  "executive_summary": "2-3 sentence high-level summary of the product",
  "problem_statement": "What specific user pain or business problem are we solving?",
  "target_users": ["User persona 1", "User persona 2", ...],
  "success_metrics": ["Quantifiable metric 1", "Quantifiable metric 2", ...],
  "functional_requirements": ["Requirement 1", "Requirement 2", ...],
  "non_functional_requirements": ["Performance req", "Security req", ...],
  "constraints": ["Budget: $X", "Timeline: Y weeks", "Team size: Z", ...],
  "assumptions": ["Assumption 1", "Assumption 2", ...],
  "out_of_scope": ["Feature X (for v2)", "Feature Y (not needed)", ...]
}}

Be comprehensive. For functional_requirements, list EVERY feature the system needs.
For non_functional_requirements, include performance, security, scalability, accessibility, etc.

Return ONLY the JSON, no additional text."""

    def _parse_markdown_response(self, content: str) -> PRDAnalysis:
        """Fallback parser for markdown-formatted responses."""
        # This is a simple fallback - in production, you'd want more robust parsing
        lines = content.split("\n")

        analysis_data = {
            "executive_summary": "Analysis pending - manual review required",
            "problem_statement": "See raw output for details",
            "target_users": ["Users to be defined"],
            "success_metrics": ["Metrics to be defined"],
            "functional_requirements": ["Requirements to be defined"],
            "non_functional_requirements": ["Requirements to be defined"],
            "constraints": ["Constraints to be defined"],
            "assumptions": ["Assumptions to be defined"],
            "out_of_scope": ["Scope to be defined"],
        }

        current_section = None
        current_list = []

        for line in lines:
            line = line.strip()

            # Detect section headers
            if "executive" in line.lower() or "summary" in line.lower():
                if current_section and current_list:
                    analysis_data[current_section] = current_list if isinstance(
                        analysis_data[current_section], list
                    ) else "\n".join(current_list)
                current_section = "executive_summary"
                current_list = []
            elif "problem" in line.lower():
                if current_section and current_list:
                    analysis_data[current_section] = current_list if isinstance(
                        analysis_data[current_section], list
                    ) else "\n".join(current_list)
                current_section = "problem_statement"
                current_list = []
            elif "target" in line.lower() and "user" in line.lower():
                if current_section and current_list:
                    analysis_data[current_section] = current_list if isinstance(
                        analysis_data[current_section], list
                    ) else "\n".join(current_list)
                current_section = "target_users"
                current_list = []
            elif "metric" in line.lower() or "success" in line.lower():
                if current_section and current_list:
                    analysis_data[current_section] = current_list if isinstance(
                        analysis_data[current_section], list
                    ) else "\n".join(current_list)
                current_section = "success_metrics"
                current_list = []
            elif "functional" in line.lower() and "requirement" in line.lower():
                if current_section and current_list:
                    analysis_data[current_section] = current_list if isinstance(
                        analysis_data[current_section], list
                    ) else "\n".join(current_list)
                current_section = "functional_requirements"
                current_list = []
            elif line.startswith("- ") or line.startswith("* "):
                # List item
                current_list.append(line[2:].strip())
            elif line and not line.startswith("#") and current_section:
                # Content line
                current_list.append(line)

        # Add final section
        if current_section and current_list:
            if isinstance(analysis_data[current_section], list):
                analysis_data[current_section] = current_list
            else:
                analysis_data[current_section] = "\n".join(current_list)

        return PRDAnalysis(**analysis_data)
