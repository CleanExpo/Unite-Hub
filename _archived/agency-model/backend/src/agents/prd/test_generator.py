"""Test Scenario Generator - Creates comprehensive test plans.

This agent generates:
- Unit test scenarios
- Integration test scenarios
- E2E test scenarios
- Test data fixtures
- Edge case coverage
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
from .tech_spec_generator import TechnicalSpec

settings = get_settings()
logger = get_logger(__name__)


class TestScenario(BaseModel):
    """Individual test scenario."""

    id: str = Field(description="Test ID (e.g., TS-001)")
    type: str = Field(description="unit | integration | e2e")
    title: str = Field(description="Test scenario title")
    description: str = Field(description="What this test validates")
    given: str = Field(description="Test preconditions/setup")
    when: str = Field(description="Action being tested")
    then: str = Field(description="Expected outcome")
    test_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Test data fixtures"
    )
    related_user_story: str | None = Field(
        default=None,
        description="User story ID this validates"
    )
    related_endpoint: str | None = Field(
        default=None,
        description="API endpoint being tested"
    )
    priority: str = Field(
        description="Critical | High | Medium | Low",
        default="Medium"
    )
    estimated_effort: str = Field(
        description="Time to implement (hours)",
        default="2-4"
    )


class TestCategory(BaseModel):
    """Group of related test scenarios."""

    category: str = Field(description="Category name (e.g., 'Authentication')")
    description: str = Field(description="What this category tests")
    test_scenarios: list[str] = Field(
        description="Test scenario IDs in this category"
    )
    coverage_target: str = Field(
        description="Target coverage percentage",
        default="80%"
    )


class TestPlan(BaseModel):
    """Comprehensive test plan."""

    # Test Scenarios
    unit_tests: list[TestScenario] = Field(
        description="Unit test scenarios (components, functions, utilities)"
    )
    integration_tests: list[TestScenario] = Field(
        description="Integration test scenarios (API endpoints, database)"
    )
    e2e_tests: list[TestScenario] = Field(
        description="E2E test scenarios (user flows, critical paths)"
    )

    # Organization
    test_categories: list[TestCategory] = Field(
        description="Tests grouped by feature/category"
    )

    # Coverage
    coverage_strategy: str = Field(
        description="How to achieve coverage targets"
    )
    critical_test_paths: list[str] = Field(
        description="Must-pass tests for deployment"
    )

    # Test Data
    test_fixtures: dict[str, Any] = Field(
        description="Reusable test data fixtures"
    )
    mock_services: list[dict[str, str]] = Field(
        default_factory=list,
        description="External services to mock (name, reason, mock_data)"
    )

    # Automation
    ci_integration: str = Field(
        description="How tests run in CI/CD pipeline"
    )
    test_frameworks: dict[str, str] = Field(
        description="Recommended test frameworks by type"
    )

    # Performance Testing
    performance_tests: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Performance/load test scenarios"
    )

    # Security Testing
    security_tests: list[str] = Field(
        default_factory=list,
        description="Security test scenarios (injection, XSS, etc.)"
    )

    # Summary
    total_test_count: int = Field(description="Total number of test scenarios")
    estimated_implementation_effort: str = Field(
        description="Total effort to implement all tests"
    )

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class TestScenarioGenerator(BaseAgent):
    """Agent that generates comprehensive test plans and scenarios.

    This agent uses Claude Opus to design test strategies covering unit,
    integration, E2E, performance, and security testing.

    Usage:
        generator = TestScenarioGenerator()
        result = await generator.execute(
            prd_analysis=analysis,
            feature_decomposition=decomposition,
            tech_spec=tech_spec,
            context={"test_framework": "Vitest + Playwright"}
        )

        test_plan = TestPlan(**result["test_plan"])
    """

    def __init__(self) -> None:
        super().__init__(
            name="test_scenario_generator",
            capabilities=[
                "unit_test_design",
                "integration_test_design",
                "e2e_test_design",
                "test_data_generation",
                "coverage_planning",
            ],
        )
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def execute(
        self,
        prd_analysis: PRDAnalysis | dict[str, Any],
        feature_decomposition: FeatureDecomposition | dict[str, Any],
        tech_spec: TechnicalSpec | dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate comprehensive test plan.

        Args:
            prd_analysis: PRDAnalysis object or dict
            feature_decomposition: FeatureDecomposition object or dict
            tech_spec: TechnicalSpec object or dict
            context: Additional context (test_framework, coverage_target, etc.)

        Returns:
            Dictionary with TestPlan and metadata
        """
        context = context or {}
        task_id = f"test_plan_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        # Convert dicts to objects if needed
        if isinstance(prd_analysis, dict):
            prd_analysis = PRDAnalysis(**prd_analysis)
        if isinstance(feature_decomposition, dict):
            feature_decomposition = FeatureDecomposition(**feature_decomposition)
        if isinstance(tech_spec, dict):
            tech_spec = TechnicalSpec(**tech_spec)

        self.logger.info(
            "Starting test plan generation",
            user_stories=len(feature_decomposition.user_stories),
            api_endpoints=len(tech_spec.api_endpoints),
            database_tables=len(tech_spec.database_schema),
        )

        try:
            # Generate the test plan using Claude Opus
            test_plan = await self._generate_test_plan(
                prd_analysis,
                feature_decomposition,
                tech_spec,
                context
            )

            # Report outputs for verification
            self.report_output(
                "test_plan",
                "scenarios",
                "Comprehensive test plan with unit, integration, and E2E scenarios"
            )

            self.logger.info(
                "Test plan generation completed",
                unit_tests=len(test_plan.unit_tests),
                integration_tests=len(test_plan.integration_tests),
                e2e_tests=len(test_plan.e2e_tests),
                total_tests=test_plan.total_test_count,
            )

            return {
                "success": True,
                "test_plan": test_plan.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("Test plan generation failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _generate_test_plan(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        tech_spec: TechnicalSpec,
        context: dict[str, Any],
    ) -> TestPlan:
        """Use Claude Opus to generate comprehensive test plan."""

        # Build the test plan prompt
        prompt = self._build_test_plan_prompt(
            prd_analysis,
            feature_decomposition,
            tech_spec,
            context
        )

        # Call Claude Opus for test planning
        response = await self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=12000,  # Large token count for comprehensive test plan
            temperature=0.4,  # Moderate temperature for test creativity
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
                test_plan_data = json.loads(json_str)
                return TestPlan(**test_plan_data)
            else:
                # Fallback: parse markdown structure
                return self._parse_markdown_response(content)

        except Exception as e:
            self.logger.warning("Failed to parse JSON, using fallback", error=str(e))
            return self._parse_markdown_response(content)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for test plan generation."""
        return """You are an expert QA engineer and test automation specialist.

Your role is to design comprehensive test strategies that ensure product quality.

Guidelines:
1. Think like a tester - find edge cases and failure scenarios
2. Design tests that are independent and repeatable
3. Use Given-When-Then format for clarity
4. Create realistic test data fixtures
5. Balance coverage with maintainability
6. Prioritize critical path tests
7. Consider both happy path and error scenarios
8. Output MUST be valid JSON matching the expected schema

Test Design Principles:
- Unit tests: Fast, isolated, test single units
- Integration tests: Test component interactions (API + DB)
- E2E tests: Test complete user flows
- Each test should validate ONE thing
- Tests should be deterministic (no flakiness)
- Use descriptive test names

Test Data Strategy:
- Create reusable fixtures for common scenarios
- Use realistic data (not "test123")
- Include edge cases (empty, null, very long, special chars)
- Mock external services to avoid dependencies

Coverage Strategy:
- Unit tests: 80%+ coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows only
- Focus on code paths, not just line coverage

Security Testing:
- SQL injection attempts
- XSS attempts
- Authentication bypass attempts
- Authorization escalation attempts
- Rate limit validation
- Input validation edge cases
"""

    def _build_test_plan_prompt(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        tech_spec: TechnicalSpec,
        context: dict[str, Any],
    ) -> str:
        """Build the test plan prompt with all context."""

        context_str = ""
        if context:
            context_str = "\n\nAdditional Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        # Summarize API endpoints
        api_summary = "\n".join(
            f"- {ep.method} {ep.path} - {ep.description} (Auth: {ep.auth_required})"
            for ep in tech_spec.api_endpoints[:10]  # First 10 to keep prompt manageable
        )

        # Summarize critical user stories
        critical_stories = [
            s for s in feature_decomposition.user_stories
            if s.priority in ["Critical", "High"]
        ]
        story_summary = "\n".join(
            f"- {s.id}: {s.title} ({s.priority})"
            for s in critical_stories[:15]  # First 15
        )

        return f"""Design a comprehensive test plan for this system.

## System Overview

**Problem**: {prd_analysis.problem_statement}

**Success Metrics**:
{chr(10).join(f"- {m}" for m in prd_analysis.success_metrics)}

**Non-Functional Requirements**:
{chr(10).join(f"- {req}" for req in prd_analysis.non_functional_requirements[:5])}

## Features to Test

**Critical User Stories**:
{story_summary}

**API Endpoints**:
{api_summary}

**Database Tables**: {len(tech_spec.database_schema)} tables
**Third-Party Services**: {', '.join(s['name'] for s in tech_spec.third_party_services)}
{context_str}

## Instructions

Create a detailed test plan in the following JSON format:

{{
  "unit_tests": [
    {{
      "id": "UT-001",
      "type": "unit",
      "title": "User registration validation",
      "description": "Validates user registration input validation",
      "given": "A user registration form with invalid email",
      "when": "User submits the form",
      "then": "Validation error is shown for invalid email format",
      "test_data": {{"email": "invalid-email", "password": "Test123!"}},
      "related_user_story": "US-001",
      "priority": "Critical",
      "estimated_effort": "1-2"
    }}
  ],
  "integration_tests": [
    {{
      "id": "IT-001",
      "type": "integration",
      "title": "User registration API endpoint",
      "description": "Tests complete registration flow with database",
      "given": "A valid user registration payload",
      "when": "POST /api/auth/register is called",
      "then": "User is created in database and JWT token is returned",
      "test_data": {{"email": "test@example.com", "password": "SecurePass123!"}},
      "related_endpoint": "POST /api/auth/register",
      "priority": "Critical",
      "estimated_effort": "2-4"
    }}
  ],
  "e2e_tests": [
    {{
      "id": "E2E-001",
      "type": "e2e",
      "title": "Complete user registration and login flow",
      "description": "Tests full user journey from registration to login",
      "given": "User is on the registration page",
      "when": "User registers and then logs in",
      "then": "User sees their dashboard with welcome message",
      "test_data": {{"email": "e2e@example.com", "password": "E2EPass123!"}},
      "related_user_story": "US-001",
      "priority": "Critical",
      "estimated_effort": "4-6"
    }}
  ],

  "test_categories": [
    {{
      "category": "Authentication",
      "description": "Tests for user registration, login, logout, password reset",
      "test_scenarios": ["UT-001", "IT-001", "E2E-001"],
      "coverage_target": "90%"
    }}
  ],

  "coverage_strategy": "80%+ unit coverage, 100% API coverage, E2E for critical flows",
  "critical_test_paths": ["UT-001", "IT-001", "E2E-001"],

  "test_fixtures": {{
    "valid_user": {{"email": "valid@example.com", "password": "ValidPass123!"}},
    "admin_user": {{"email": "admin@example.com", "password": "AdminPass123!", "role": "admin"}},
    "invalid_emails": ["not-an-email", "@example.com", "user@", ""],
    "weak_passwords": ["123", "password", ""]
  }},

  "mock_services": [
    {{
      "name": "Email Service (Resend)",
      "reason": "Avoid sending real emails in tests",
      "mock_data": "{{\\"message_id\\": \\"mock-123\\", \\"status\\": \\"sent\\"}}"
    }}
  ],

  "ci_integration": "Run unit tests on every commit, integration tests on PR, E2E tests before deployment",
  "test_frameworks": {{
    "unit": "Vitest for frontend, Pytest for backend",
    "integration": "Pytest with FastAPI TestClient",
    "e2e": "Playwright"
  }},

  "performance_tests": [
    {{
      "name": "API response time",
      "target": "< 200ms p95",
      "test": "Load test API endpoints with 100 concurrent users"
    }}
  ],

  "security_tests": [
    "SQL injection: Try malicious SQL in all text inputs",
    "XSS: Try script tags in user-generated content",
    "Authentication bypass: Try accessing protected routes without token",
    "Authorization: Try accessing other users' data",
    "Rate limiting: Send 1000 requests and verify throttling"
  ],

  "total_test_count": 25,
  "estimated_implementation_effort": "40-60 hours"
}}

## Requirements

1. **Unit Tests**: At least 10-15 scenarios covering components, utilities, validation
2. **Integration Tests**: At least 5-10 scenarios covering all critical API endpoints
3. **E2E Tests**: At least 3-5 scenarios covering critical user flows
4. **Test Data**: Include realistic fixtures for common test cases
5. **Security**: Include security test scenarios (injection, XSS, auth bypass)
6. **Performance**: Include at least 2-3 performance test scenarios
7. **Coverage**: Aim for 80%+ unit, 100% API endpoints, critical path E2E

Be comprehensive and production-ready.
Return ONLY the JSON, no additional text."""

    def _parse_markdown_response(self, content: str) -> TestPlan:
        """Fallback parser for markdown-formatted responses."""
        # Simplified fallback - in production, you'd want more robust parsing

        fallback_test = TestScenario(
            id="TS-001",
            type="unit",
            title="Manual test planning required",
            description="Test plan generation requires manual review",
            given="Test plan generation completed",
            when="Developer reviews output",
            then="Proper test scenarios are created",
            priority="Critical",
        )

        return TestPlan(
            unit_tests=[fallback_test],
            integration_tests=[],
            e2e_tests=[],
            test_categories=[
                TestCategory(
                    category="Manual Review",
                    description="Manual test planning required",
                    test_scenarios=["TS-001"],
                )
            ],
            coverage_strategy="Manual review required",
            critical_test_paths=["TS-001"],
            test_fixtures={"manual_review": "required"},
            ci_integration="To be determined",
            test_frameworks={"unit": "Vitest", "integration": "Pytest", "e2e": "Playwright"},
            total_test_count=1,
            estimated_implementation_effort="Manual review required",
        )
