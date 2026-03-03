"""Default Tool Definitions with Advanced Features.

This module defines all tools available in the system with:
- defer_loading for context efficiency
- allowed_callers for programmatic execution
- input_examples for parameter accuracy

Tools are organized by category:
- CORE: Always loaded, frequently used
- DEFERRED: Loaded on-demand via Tool Search
- PROGRAMMATIC: Can be called from code execution
"""

from .registry import (
    ToolCategory,
    ToolConfig,
    ToolDefinition,
    ToolExample,
    ToolRegistry,
    get_registry,
)


def register_core_tools(registry: ToolRegistry) -> None:
    """Register core tools that are always loaded.

    These are high-frequency tools that should always be available.
    Keep this list minimal (3-5 tools) to preserve context.
    """

    # Health Check - Always available
    registry.register(
        ToolDefinition(
            name="health_check",
            description="Check system health status including all dependencies",
            input_schema={
                "type": "object",
                "properties": {
                    "deep": {
                        "type": "boolean",
                        "description": "Perform deep health check including all dependencies",
                        "default": False,
                    },
                },
            },
            config=ToolConfig(
                defer_loading=False,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
                cache_results=True,
                cache_ttl_seconds=30,
            ),
            examples=[
                ToolExample(
                    description="Quick health check",
                    input={},
                    expected_behavior="Returns basic health status",
                ),
                ToolExample(
                    description="Deep health check with dependencies",
                    input={"deep": True},
                    expected_behavior="Checks database, backend, and verification system",
                ),
            ],
            categories=[ToolCategory.CORE, ToolCategory.MONITORING],
            keywords=["health", "status", "ping", "alive", "check"],
        )
    )

    # Task Status - Core workflow tool
    registry.register(
        ToolDefinition(
            name="get_task_status",
            description="Get the current status of a task by ID",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The unique task identifier",
                    },
                },
                "required": ["task_id"],
            },
            config=ToolConfig(
                defer_loading=False,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Check task status",
                    input={"task_id": "task_abc123"},
                    expected_behavior="Returns task status, progress, and any errors",
                ),
            ],
            categories=[ToolCategory.CORE],
            keywords=["task", "status", "progress", "check"],
        )
    )


def register_verification_tools(registry: ToolRegistry) -> None:
    """Register verification tools - deferred for context efficiency."""

    # Independent Verification
    registry.register(
        ToolDefinition(
            name="verification.verify_task",
            description="Independently verify a task's outputs without self-attestation",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "Task to verify",
                    },
                    "criteria": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": [
                                        "file_exists",
                                        "file_not_empty",
                                        "no_placeholders",
                                        "code_compiles",
                                        "tests_pass",
                                    ],
                                },
                                "target": {"type": "string"},
                            },
                        },
                        "description": "Verification criteria to check",
                    },
                },
                "required": ["task_id", "criteria"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Verify file creation",
                    input={
                        "task_id": "task_123",
                        "criteria": [
                            {"type": "file_exists", "target": "/src/component.tsx"},
                            {"type": "no_placeholders", "target": "/src/component.tsx"},
                        ],
                    },
                    expected_behavior="Returns verification result with evidence",
                ),
                ToolExample(
                    description="Verify code compiles",
                    input={
                        "task_id": "task_456",
                        "criteria": [
                            {"type": "code_compiles", "target": "pnpm type-check"},
                            {"type": "tests_pass", "target": "pnpm test"},
                        ],
                    },
                ),
            ],
            categories=[ToolCategory.VERIFICATION],
            keywords=["verify", "check", "validate", "confirm", "evidence"],
            aliases=["verify", "check_task", "validate_output"],
        )
    )

    # Evidence Collection
    registry.register(
        ToolDefinition(
            name="verification.collect_evidence",
            description="Collect and store evidence for verification claims",
            input_schema={
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["screenshot", "log", "metric", "trace"],
                    },
                    "source": {"type": "string"},
                    "category": {
                        "type": "string",
                        "enum": ["pass", "fail", "warning", "info"],
                    },
                    "content": {"type": "string"},
                    "metadata": {"type": "object"},
                },
                "required": ["type", "source", "category", "content"],
            },
            config=ToolConfig(
                defer_loading=True,
                parallel_safe=True,
            ),
            categories=[ToolCategory.VERIFICATION],
            keywords=["evidence", "collect", "store", "proof", "capture"],
        )
    )


def register_audit_tools(registry: ToolRegistry) -> None:
    """Register audit tools - deferred for context efficiency."""

    # User Journey Runner
    registry.register(
        ToolDefinition(
            name="audit.run_journey",
            description="Execute a user journey and collect evidence at each step",
            input_schema={
                "type": "object",
                "properties": {
                    "journey_id": {
                        "type": "string",
                        "description": "ID of predefined journey or 'custom'",
                    },
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {"type": "string"},
                                "target": {"type": "string"},
                                "expected": {"type": "string"},
                            },
                        },
                        "description": "Journey steps (required if journey_id is 'custom')",
                    },
                },
                "required": ["journey_id"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=False,
            ),
            examples=[
                ToolExample(
                    description="Run health check journey",
                    input={"journey_id": "health_check"},
                    expected_behavior="Executes all health endpoints and reports results",
                ),
                ToolExample(
                    description="Run custom journey",
                    input={
                        "journey_id": "custom",
                        "steps": [
                            {"action": "navigate", "target": "/", "expected": "page loads"},
                            {"action": "click", "target": "#login", "expected": "modal opens"},
                        ],
                    },
                ),
            ],
            categories=[ToolCategory.AUDIT],
            keywords=["journey", "flow", "user", "test", "e2e", "integration"],
        )
    )

    # API Route Auditor
    registry.register(
        ToolDefinition(
            name="audit.audit_routes",
            description="Audit API routes for security, validation, and error handling",
            input_schema={
                "type": "object",
                "properties": {
                    "routes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific routes to audit (empty = all routes)",
                    },
                    "checks": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": [
                                "security",
                                "validation",
                                "error_handling",
                                "performance",
                                "documentation",
                            ],
                        },
                        "description": "Types of checks to perform",
                    },
                },
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Full route audit",
                    input={"routes": [], "checks": ["security", "validation", "error_handling"]},
                ),
                ToolExample(
                    description="Security audit only",
                    input={"routes": ["/api/auth/*"], "checks": ["security"]},
                ),
            ],
            categories=[ToolCategory.AUDIT, ToolCategory.API],
            keywords=["audit", "routes", "api", "security", "validation"],
        )
    )

    # Friction Detector
    registry.register(
        ToolDefinition(
            name="audit.detect_friction",
            description="Analyze user journeys for UX friction points",
            input_schema={
                "type": "object",
                "properties": {
                    "journey_result_id": {
                        "type": "string",
                        "description": "ID of a completed journey result to analyze",
                    },
                },
                "required": ["journey_result_id"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
            ),
            categories=[ToolCategory.AUDIT],
            keywords=["friction", "ux", "usability", "analyze"],
        )
    )

    # Report Generator
    registry.register(
        ToolDefinition(
            name="audit.generate_report",
            description="Generate comprehensive audit report in various formats",
            input_schema={
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string",
                        "enum": ["json", "markdown", "html"],
                        "default": "markdown",
                    },
                    "include": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": [
                                "health",
                                "journeys",
                                "routes",
                                "friction",
                                "recommendations",
                            ],
                        },
                    },
                },
            },
            config=ToolConfig(
                defer_loading=True,
            ),
            examples=[
                ToolExample(
                    description="Full markdown report",
                    input={"format": "markdown", "include": ["health", "journeys", "routes", "recommendations"]},
                ),
                ToolExample(
                    description="JSON health report",
                    input={"format": "json", "include": ["health"]},
                ),
            ],
            categories=[ToolCategory.AUDIT],
            keywords=["report", "generate", "summary", "export"],
        )
    )


def register_database_tools(registry: ToolRegistry) -> None:
    """Register database tools - deferred and programmatic."""

    registry.register(
        ToolDefinition(
            name="database.query",
            description="Execute a database query and return results",
            input_schema={
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "Table to query",
                    },
                    "select": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Columns to select",
                    },
                    "filters": {
                        "type": "object",
                        "description": "Filter conditions",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                    },
                },
                "required": ["table"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
                cache_results=True,
                cache_ttl_seconds=60,
            ),
            examples=[
                ToolExample(
                    description="Query users",
                    input={
                        "table": "profiles",
                        "select": ["id", "email", "created_at"],
                        "filters": {"status": "active"},
                        "limit": 50,
                    },
                ),
                ToolExample(
                    description="Query recent evidence",
                    input={
                        "table": "audit_evidence",
                        "select": ["*"],
                        "filters": {"category": "fail"},
                        "limit": 10,
                    },
                ),
            ],
            categories=[ToolCategory.DATABASE],
            keywords=["database", "query", "select", "supabase", "sql"],
            aliases=["db_query", "sql_query"],
        )
    )

    registry.register(
        ToolDefinition(
            name="database.insert",
            description="Insert a record into a database table",
            input_schema={
                "type": "object",
                "properties": {
                    "table": {"type": "string"},
                    "data": {"type": "object"},
                },
                "required": ["table", "data"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=False,
                retry_safe=False,
            ),
            categories=[ToolCategory.DATABASE],
            keywords=["database", "insert", "create", "add"],
        )
    )


def register_file_tools(registry: ToolRegistry) -> None:
    """Register file system tools - deferred and programmatic."""

    registry.register(
        ToolDefinition(
            name="file.read",
            description="Read contents of a file",
            input_schema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute path to file",
                    },
                    "encoding": {
                        "type": "string",
                        "default": "utf-8",
                    },
                },
                "required": ["path"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Read TypeScript file",
                    input={"path": "/src/components/Button.tsx"},
                ),
                ToolExample(
                    description="Read JSON config",
                    input={"path": "/package.json", "encoding": "utf-8"},
                ),
            ],
            categories=[ToolCategory.FILE_SYSTEM],
            keywords=["file", "read", "content", "load"],
        )
    )

    registry.register(
        ToolDefinition(
            name="file.write",
            description="Write contents to a file",
            input_schema={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                    "encoding": {"type": "string", "default": "utf-8"},
                },
                "required": ["path", "content"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=False,
            ),
            categories=[ToolCategory.FILE_SYSTEM],
            keywords=["file", "write", "save", "create"],
        )
    )

    registry.register(
        ToolDefinition(
            name="file.list",
            description="List files in a directory matching a pattern",
            input_schema={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "pattern": {
                        "type": "string",
                        "description": "Glob pattern (e.g., '*.ts')",
                    },
                    "recursive": {"type": "boolean", "default": False},
                },
                "required": ["path"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="List TypeScript files",
                    input={"path": "/src", "pattern": "*.ts", "recursive": True},
                ),
            ],
            categories=[ToolCategory.FILE_SYSTEM],
            keywords=["file", "list", "directory", "find", "glob"],
        )
    )


def register_copywriting_tools(registry: ToolRegistry) -> None:
    """Register copywriting tools - deferred for context efficiency.

    INTEGRITY REQUIREMENTS (Non-negotiable):
    - 100% UNIQUE: No copied content
    - ZERO PLAGIARISM: Not even close paraphrasing
    - 100% VERIFIABLE: Every claim must have evidence
    """

    # Audience Research
    registry.register(
        ToolDefinition(
            name="copywriting.research_audience",
            description="Research audience pain points, symptoms, and desires from real sources",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business",
                    },
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["reviews", "forums", "social", "interviews", "support"],
                        },
                        "description": "Data sources to search",
                    },
                    "category": {
                        "type": "string",
                        "enum": ["pain_point", "symptom", "dream_outcome", "failed_solution", "buying_decision"],
                        "description": "Category of quotes to collect",
                    },
                },
                "required": ["business_id"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Collect pain points from reviews",
                    input={
                        "business_id": "biz_123",
                        "sources": ["reviews", "forums"],
                        "category": "pain_point",
                    },
                    expected_behavior="Returns exact customer quotes categorized by type",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["research", "audience", "voice", "customer", "quotes", "pain", "copywriting"],
        )
    )

    # Competitor Analysis
    registry.register(
        ToolDefinition(
            name="copywriting.analyze_competitor",
            description="Analyze competitor pages for structure and sections",
            input_schema={
                "type": "object",
                "properties": {
                    "competitor_url": {
                        "type": "string",
                        "description": "URL of competitor page to analyze",
                    },
                    "page_type": {
                        "type": "string",
                        "enum": ["homepage", "services", "about", "contact", "pricing", "faq"],
                        "description": "Type of page being analyzed",
                    },
                },
                "required": ["competitor_url", "page_type"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Analyze competitor homepage",
                    input={
                        "competitor_url": "https://competitor.com.au",
                        "page_type": "homepage",
                    },
                    expected_behavior="Returns page sections in order with notes",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["competitor", "analysis", "pages", "sections", "structure", "copywriting"],
        )
    )

    # Copy Generation
    registry.register(
        ToolDefinition(
            name="copywriting.generate_copy",
            description="Generate conversion-focused copy using customer language (100% original required)",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business",
                    },
                    "page_type": {
                        "type": "string",
                        "enum": ["homepage", "services", "about", "contact", "landing"],
                        "description": "Type of page to generate copy for",
                    },
                    "section": {
                        "type": "string",
                        "enum": ["hero", "problem", "value_props", "social_proof", "process", "faq", "cta"],
                        "description": "Specific section (optional)",
                    },
                    "research_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "IDs of audience research to use as inspiration",
                    },
                },
                "required": ["business_id", "page_type"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Generate homepage hero",
                    input={
                        "business_id": "biz_123",
                        "page_type": "homepage",
                        "section": "hero",
                        "research_ids": ["research_abc", "research_def"],
                    },
                    expected_behavior="Returns unique, customer-voice copy with claims to verify",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["copy", "generate", "write", "content", "conversion", "copywriting"],
        )
    )

    # Copy Validation
    registry.register(
        ToolDefinition(
            name="copywriting.validate_copy",
            description="Validate copy for integrity: uniqueness, plagiarism, verifiability",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "Copy content to validate",
                    },
                    "checks": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["plagiarism", "uniqueness", "verifiability", "jargon", "tone"],
                        },
                        "description": "Validation checks to run",
                    },
                },
                "required": ["content"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Full integrity check",
                    input={
                        "content": "Your copy here...",
                        "checks": ["plagiarism", "uniqueness", "verifiability"],
                    },
                    expected_behavior="Returns integrity scores and claims requiring evidence",
                ),
            ],
            categories=[ToolCategory.MARKETING, ToolCategory.VERIFICATION],
            keywords=["validate", "copy", "integrity", "plagiarism", "verify", "copywriting"],
        )
    )


def register_consistency_tools(registry: ToolRegistry) -> None:
    """Register business consistency tools - deferred for context efficiency."""

    # NAP Audit
    registry.register(
        ToolDefinition(
            name="consistency.audit_nap",
            description="Audit NAP consistency across all platforms",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business to audit",
                    },
                    "platform_tiers": {
                        "type": "array",
                        "items": {"type": "integer", "minimum": 1, "maximum": 5},
                        "description": "Platform tiers to audit (1-5)",
                    },
                },
                "required": ["business_id"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Full NAP audit",
                    input={
                        "business_id": "biz_123",
                        "platform_tiers": [1, 2, 3],
                    },
                    expected_behavior="Returns consistency score and platform-by-platform breakdown",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["audit", "nap", "consistency", "local", "seo", "business"],
        )
    )

    # Schema Generation
    registry.register(
        ToolDefinition(
            name="consistency.generate_schema",
            description="Generate JSON-LD schema markup from business data",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business",
                    },
                    "schema_type": {
                        "type": "string",
                        "enum": ["LocalBusiness", "Organization", "FAQ", "HowTo", "Service"],
                        "description": "Type of schema to generate",
                    },
                },
                "required": ["business_id", "schema_type"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Generate LocalBusiness schema",
                    input={
                        "business_id": "biz_123",
                        "schema_type": "LocalBusiness",
                    },
                    expected_behavior="Returns valid JSON-LD schema with all NAP data",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["schema", "jsonld", "structured", "data", "local", "business"],
        )
    )

    # Platform Check
    registry.register(
        ToolDefinition(
            name="consistency.check_platform",
            description="Check a specific platform listing for NAP accuracy",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business",
                    },
                    "platform_name": {
                        "type": "string",
                        "description": "Platform to check (e.g., 'Google Business Profile')",
                    },
                    "listing_url": {
                        "type": "string",
                        "description": "URL of the listing to check",
                    },
                },
                "required": ["business_id", "platform_name"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Check Google Business Profile",
                    input={
                        "business_id": "biz_123",
                        "platform_name": "Google Business Profile",
                    },
                    expected_behavior="Returns field-by-field comparison with master document",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["platform", "listing", "check", "nap", "consistency"],
        )
    )

    # Export Master Document
    registry.register(
        ToolDefinition(
            name="consistency.export_master",
            description="Export the master consistency document for a business",
            input_schema={
                "type": "object",
                "properties": {
                    "business_id": {
                        "type": "string",
                        "description": "ID of the business",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["yaml", "json", "markdown"],
                        "default": "yaml",
                        "description": "Export format",
                    },
                },
                "required": ["business_id"],
            },
            config=ToolConfig(
                defer_loading=True,
                allowed_callers=["code_execution_20250825"],
                parallel_safe=True,
            ),
            examples=[
                ToolExample(
                    description="Export as YAML",
                    input={
                        "business_id": "biz_123",
                        "format": "yaml",
                    },
                    expected_behavior="Returns complete master document in YAML format",
                ),
            ],
            categories=[ToolCategory.MARKETING],
            keywords=["export", "master", "document", "consistency", "nap"],
        )
    )


def register_all_tools() -> ToolRegistry:
    """Register all tools and return the registry.

    This is the main entry point for tool registration.
    """
    registry = get_registry()

    # Register all tool categories
    register_core_tools(registry)
    register_verification_tools(registry)
    register_audit_tools(registry)
    register_database_tools(registry)
    register_file_tools(registry)
    # Marketing tools
    register_copywriting_tools(registry)
    register_consistency_tools(registry)
    # RAG tools
    register_rag_tools(registry)

    return registry


def register_rag_tools(registry: ToolRegistry) -> None:
    """Register RAG (Retrieval-Augmented Generation) tools."""
    from src.tools.rag_tools import RAG_SEARCH_TOOL

    registry.register(RAG_SEARCH_TOOL)


# Context savings estimate
def get_tool_stats() -> dict:
    """Get statistics about registered tools."""
    registry = get_registry()
    stats = registry.get_context_stats()

    stats["categories"] = {}
    for tool in registry._tools.values():
        for cat in tool.categories:
            stats["categories"][cat.value] = stats["categories"].get(cat.value, 0) + 1

    stats["programmatic_tools"] = len(registry.get_programmatic_tools())

    return stats
