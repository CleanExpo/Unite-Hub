"""Technical Specification Generator - Creates detailed technical design.

This agent takes PRD analysis and feature decomposition and generates:
- System architecture overview
- Database schema design
- API endpoints specification
- Technology stack recommendations
- Security considerations
- Scalability approach
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
from .analysis_agent import PRDAnalysis
from .feature_decomposer import FeatureDecomposition

settings = get_settings()
logger = get_logger(__name__)


class DatabaseTable(BaseModel):
    """Database table specification."""

    name: str = Field(description="Table name (snake_case)")
    description: str = Field(description="What this table stores")
    columns: list[dict[str, str]] = Field(
        description="List of {name, type, constraints, description}"
    )
    indexes: list[str] = Field(
        default_factory=list,
        description="Indexes to create"
    )
    relationships: list[str] = Field(
        default_factory=list,
        description="Foreign key relationships"
    )


class APIEndpoint(BaseModel):
    """API endpoint specification."""

    method: str = Field(description="GET | POST | PUT | PATCH | DELETE")
    path: str = Field(description="Endpoint path (e.g., /api/users/{id})")
    description: str = Field(description="What this endpoint does")
    auth_required: bool = Field(description="Requires authentication")
    request_body: dict[str, Any] | None = Field(
        default=None,
        description="Request body schema (JSON Schema format)"
    )
    response: dict[str, Any] = Field(
        description="Response schema (JSON Schema format)"
    )
    rate_limit: str | None = Field(
        default=None,
        description="Rate limit (e.g., '100/hour')"
    )
    related_user_story: str | None = Field(
        default=None,
        description="User story ID this implements"
    )


class TechnicalSpec(BaseModel):
    """Complete technical specification."""

    # Architecture
    architecture_overview: str = Field(
        description="High-level system architecture description"
    )
    architecture_diagram_mermaid: str = Field(
        description="Mermaid diagram code for architecture"
    )

    # Database
    database_schema: list[DatabaseTable] = Field(
        description="Database tables and relationships"
    )
    database_migrations_needed: list[str] = Field(
        description="Migration steps required"
    )

    # API Design
    api_endpoints: list[APIEndpoint] = Field(
        description="REST API endpoints"
    )
    api_versioning_strategy: str = Field(
        description="How API versioning will work"
    )

    # Technology Stack
    recommended_stack: dict[str, str] = Field(
        description="Technology recommendations by category"
    )
    existing_stack_integration: list[str] = Field(
        description="How to integrate with existing stack"
    )

    # Security
    security_considerations: list[str] = Field(
        description="Security measures needed"
    )
    authentication_approach: str = Field(
        description="How authentication will work"
    )
    authorization_model: str = Field(
        description="How permissions will work (RBAC, ABAC, etc.)"
    )

    # Performance & Scalability
    scalability_approach: str = Field(
        description="How the system will scale"
    )
    performance_targets: dict[str, str] = Field(
        description="Performance requirements by metric"
    )
    caching_strategy: str = Field(
        description="What and how to cache"
    )

    # Integration
    third_party_services: list[dict[str, str]] = Field(
        default_factory=list,
        description="External services needed (name, purpose, API)"
    )
    integration_points: list[str] = Field(
        description="How components integrate"
    )

    # Deployment
    deployment_architecture: str = Field(
        description="How the system will be deployed"
    )
    infrastructure_requirements: list[str] = Field(
        description="Infrastructure needed"
    )

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class TechnicalSpecGenerator(BaseAgent):
    """Agent that generates comprehensive technical specifications.

    This agent uses Claude Opus to design system architecture, database schema,
    API endpoints, and technical implementation details.

    Usage:
        generator = TechnicalSpecGenerator()
        result = await generator.execute(
            prd_analysis=analysis,
            feature_decomposition=decomposition,
            context={"existing_stack": "Next.js + FastAPI + Supabase"}
        )

        tech_spec = TechnicalSpec(**result["specification"])
    """

    def __init__(self) -> None:
        super().__init__(
            name="tech_spec_generator",
            capabilities=[
                "system_architecture",
                "database_design",
                "api_design",
                "security_design",
                "scalability_planning",
            ],
        )
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def execute(
        self,
        prd_analysis: PRDAnalysis | dict[str, Any],
        feature_decomposition: FeatureDecomposition | dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate technical specification.

        Args:
            prd_analysis: PRDAnalysis object or dict
            feature_decomposition: FeatureDecomposition object or dict
            context: Additional context (existing_stack, constraints, etc.)

        Returns:
            Dictionary with TechnicalSpec and metadata
        """
        context = context or {}
        task_id = f"tech_spec_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        # Convert dicts to objects if needed
        if isinstance(prd_analysis, dict):
            prd_analysis = PRDAnalysis(**prd_analysis)
        if isinstance(feature_decomposition, dict):
            feature_decomposition = FeatureDecomposition(**feature_decomposition)

        self.logger.info(
            "Starting technical specification generation",
            functional_reqs=len(prd_analysis.functional_requirements),
            user_stories=len(feature_decomposition.user_stories),
            epics=len(feature_decomposition.epics),
        )

        try:
            # Generate the technical specification using Claude Opus
            specification = await self._generate_specification(
                prd_analysis,
                feature_decomposition,
                context
            )

            # Report outputs for verification
            self.report_output(
                "technical_specification",
                "spec",
                "Complete technical specification with architecture and API design"
            )

            self.logger.info(
                "Technical specification completed",
                database_tables=len(specification.database_schema),
                api_endpoints=len(specification.api_endpoints),
                third_party_services=len(specification.third_party_services),
            )

            return {
                "success": True,
                "specification": specification.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("Technical specification generation failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _generate_specification(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        context: dict[str, Any],
    ) -> TechnicalSpec:
        """Use Claude Opus to generate technical specification."""

        # Build the specification prompt
        prompt = self._build_specification_prompt(
            prd_analysis,
            feature_decomposition,
            context
        )

        # Call Claude Opus for deep technical analysis
        response = await self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=12000,  # Large token count for comprehensive spec
            temperature=0.3,  # Lower temperature for technical accuracy
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
                spec_data = json.loads(json_str)
                return TechnicalSpec(**spec_data)
            else:
                # Fallback: parse markdown structure
                return self._parse_markdown_response(content)

        except Exception as e:
            self.logger.warning("Failed to parse JSON, using fallback", error=str(e))
            return self._parse_markdown_response(content)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for technical specification generation."""
        return """You are an expert senior software architect and technical lead.

Your role is to design comprehensive, production-ready technical specifications.

Guidelines:
1. Design for scalability from day one (but don't over-engineer)
2. Follow industry best practices and patterns
3. Consider security at every layer
4. Design APIs that are intuitive and RESTful
5. Create database schemas that are normalized and performant
6. Think about monitoring, logging, and observability
7. Consider failure scenarios and error handling
8. Design for testability
9. Output MUST be valid JSON matching the expected schema

Architecture Principles:
- Separation of concerns
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)

Database Design:
- Normalize to 3NF minimum
- Use appropriate indexes
- Consider query patterns
- Plan for data growth
- Use constraints for data integrity

API Design:
- RESTful conventions (GET for read, POST for create, etc.)
- Proper HTTP status codes
- Versioning strategy (v1, v2 in path)
- Consistent error responses
- Pagination for lists
- Rate limiting for protection

Security:
- Authentication (JWT, OAuth, API keys)
- Authorization (RBAC, RLS)
- Input validation
- SQL injection prevention
- XSS prevention
- CSRF tokens
- Rate limiting
- Audit logging
"""

    def _build_specification_prompt(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        context: dict[str, Any],
    ) -> str:
        """Build the specification prompt with all context."""

        context_str = ""
        if context:
            context_str = "\n\nAdditional Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        # Summarize user stories by epic
        epics_summary = []
        for epic in feature_decomposition.epics:
            story_titles = [
                f"  - {s.title}"
                for s in feature_decomposition.user_stories
                if s.epic == epic.id
            ]
            epics_summary.append(
                f"**{epic.name}** ({epic.id}):\n" + "\n".join(story_titles)
            )

        return f"""Design a comprehensive technical specification for this system.

## Product Requirements

**Problem**: {prd_analysis.problem_statement}

**Target Users**: {', '.join(prd_analysis.target_users)}

**Success Metrics**:
{chr(10).join(f"- {m}" for m in prd_analysis.success_metrics)}

**Non-Functional Requirements**:
{chr(10).join(f"- {req}" for req in prd_analysis.non_functional_requirements)}

## Features to Implement

{chr(10).join(epics_summary)}

**Total User Stories**: {len(feature_decomposition.user_stories)}
**Critical Path**: {', '.join(feature_decomposition.critical_path)}
{context_str}

## Instructions

Create a detailed technical specification in the following JSON format:

{{
  "architecture_overview": "High-level description of system architecture (3-4 paragraphs)",
  "architecture_diagram_mermaid": "graph TD\\n  A[Frontend] --> B[API Gateway]\\n  ...",

  "database_schema": [
    {{
      "name": "users",
      "description": "User accounts and profiles",
      "columns": [
        {{"name": "id", "type": "UUID", "constraints": "PRIMARY KEY", "description": "User ID"}},
        {{"name": "email", "type": "VARCHAR(255)", "constraints": "UNIQUE NOT NULL", "description": "Email"}},
        {{"name": "created_at", "type": "TIMESTAMPTZ", "constraints": "DEFAULT NOW()", "description": "Creation time"}}
      ],
      "indexes": ["CREATE INDEX idx_users_email ON users(email)"],
      "relationships": []
    }}
  ],
  "database_migrations_needed": [
    "Create users table",
    "Add RLS policies for users table",
    "Create indexes for common queries"
  ],

  "api_endpoints": [
    {{
      "method": "POST",
      "path": "/api/auth/register",
      "description": "Register new user account",
      "auth_required": false,
      "request_body": {{
        "type": "object",
        "properties": {{"email": {{"type": "string"}}, "password": {{"type": "string"}}}}
      }},
      "response": {{
        "type": "object",
        "properties": {{"user_id": {{"type": "string"}}, "token": {{"type": "string"}}}}
      }},
      "rate_limit": "5/minute",
      "related_user_story": "US-001"
    }}
  ],
  "api_versioning_strategy": "Path-based versioning (e.g., /api/v1/...)",

  "recommended_stack": {{
    "frontend": "Next.js 15 with React 19",
    "backend": "FastAPI with Python 3.11+",
    "database": "PostgreSQL 15+ with Supabase",
    "cache": "Redis for session and query caching",
    "storage": "Supabase Storage for file uploads",
    "auth": "Supabase Auth with JWT tokens"
  }},
  "existing_stack_integration": [
    "Use existing Next.js app in apps/web",
    "Extend FastAPI backend in apps/backend",
    "Add new tables to existing Supabase database"
  ],

  "security_considerations": [
    "Use Supabase Row Level Security for multi-tenant data isolation",
    "Implement rate limiting on all public endpoints",
    "Validate all input using Pydantic models",
    "Use parameterized queries to prevent SQL injection",
    "Set secure headers (CSP, HSTS, X-Frame-Options)"
  ],
  "authentication_approach": "JWT tokens issued by Supabase Auth, validated on each request",
  "authorization_model": "Row Level Security (RLS) policies in Supabase for data access control",

  "scalability_approach": "Horizontal scaling of API servers, database read replicas, Redis cluster",
  "performance_targets": {{
    "api_response_time": "< 200ms p95",
    "database_query_time": "< 50ms p95",
    "page_load_time": "< 2s",
    "concurrent_users": "10,000+"
  }},
  "caching_strategy": "Redis for session data (15 min TTL), query results (5 min TTL), and rate limit counters",

  "third_party_services": [
    {{"name": "Resend", "purpose": "Transactional emails", "api": "REST API with API key"}},
    {{"name": "Stripe", "purpose": "Payment processing", "api": "REST API + webhooks"}}
  ],
  "integration_points": [
    "Frontend calls backend API via fetch()",
    "Backend queries Supabase via PostgREST client",
    "Supabase Realtime pushes updates to frontend via WebSockets"
  ],

  "deployment_architecture": "Frontend on Vercel, Backend on Railway, Database on Supabase Cloud",
  "infrastructure_requirements": [
    "2x API servers (auto-scaling)",
    "PostgreSQL instance with 4GB RAM minimum",
    "Redis instance with 1GB RAM",
    "CDN for static assets (Vercel Edge Network)"
  ]
}}

## Requirements

1. **Database Schema**: Design ALL tables needed. Include types, constraints, indexes, and relationships.
2. **API Endpoints**: Design ALL endpoints needed. Follow REST conventions.
3. **Security**: Cover authentication, authorization, validation, and attack prevention.
4. **Performance**: Set realistic targets and explain caching/scaling approach.
5. **Architecture Diagram**: Use Mermaid syntax to show major components and data flow.
6. **Integration**: Explain how this integrates with existing stack (Next.js + FastAPI + Supabase).

Be comprehensive and production-ready.
Return ONLY the JSON, no additional text."""

    def _parse_markdown_response(self, content: str) -> TechnicalSpec:
        """Fallback parser for markdown-formatted responses."""
        # Simplified fallback - in production, you'd want more robust parsing

        return TechnicalSpec(
            architecture_overview="Technical specification requires manual review. See raw output for details.",
            architecture_diagram_mermaid="graph TD\n  A[Manual Review Required]",
            database_schema=[
                DatabaseTable(
                    name="placeholder",
                    description="Schema design pending",
                    columns=[
                        {
                            "name": "id",
                            "type": "UUID",
                            "constraints": "PRIMARY KEY",
                            "description": "Primary key"
                        }
                    ],
                )
            ],
            database_migrations_needed=["Manual review required"],
            api_endpoints=[
                APIEndpoint(
                    method="GET",
                    path="/api/status",
                    description="Health check",
                    auth_required=False,
                    response={"type": "object", "properties": {"status": {"type": "string"}}},
                )
            ],
            api_versioning_strategy="To be determined",
            recommended_stack={
                "frontend": "Next.js 15",
                "backend": "FastAPI",
                "database": "PostgreSQL via Supabase",
            },
            existing_stack_integration=["Manual integration planning required"],
            security_considerations=["Security audit required"],
            authentication_approach="To be determined",
            authorization_model="To be determined",
            scalability_approach="Manual scalability planning required",
            performance_targets={"manual_review": "required"},
            caching_strategy="To be determined",
            deployment_architecture="To be determined",
            infrastructure_requirements=["Manual infrastructure planning required"],
        )
