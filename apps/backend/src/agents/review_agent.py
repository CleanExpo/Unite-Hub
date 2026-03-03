"""Review Agent - Dedicated code review agent for analyzing changes and providing feedback.

This agent performs structured code reviews, analyzing:
- Code quality and maintainability
- Potential bugs and edge cases
- Security vulnerabilities
- Performance concerns
- Style and convention adherence
- Test coverage

IMPORTANT: This is for review/feedback, NOT for verification.
Independent verification still done by IndependentVerifier.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel

from src.agents.base_agent import BaseAgent
from src.utils import get_logger

logger = get_logger(__name__)


class IssueSeverity(str, Enum):
    """Severity levels for code review issues."""

    CRITICAL = "critical"  # Must fix before merge
    HIGH = "high"  # Should fix before merge
    MEDIUM = "medium"  # Should address
    LOW = "low"  # Nice to have
    INFO = "info"  # Informational only


class IssueCategory(str, Enum):
    """Categories for code review issues."""

    BUG = "bug"  # Potential bug
    SECURITY = "security"  # Security vulnerability
    PERFORMANCE = "performance"  # Performance concern
    STYLE = "style"  # Code style/convention
    MAINTAINABILITY = "maintainability"  # Code quality/readability
    TESTING = "testing"  # Test coverage/quality
    DOCUMENTATION = "documentation"  # Missing/incorrect docs
    BEST_PRACTICE = "best_practice"  # Doesn't follow best practices


class ReviewIssue(BaseModel):
    """A single issue found during code review."""

    category: IssueCategory
    severity: IssueSeverity
    file_path: str
    line_number: int | None = None
    title: str
    description: str
    suggestion: str | None = None


class ReviewResult(BaseModel):
    """Result of a code review."""

    review_id: str
    agent_id: str
    task_id: str
    timestamp: str
    files_reviewed: list[str]
    issues: list[ReviewIssue]
    summary: dict[str, int]  # Count by severity
    overall_assessment: str
    approved: bool


class ReviewAgent(BaseAgent):
    """Agent specialized in code review and analysis."""

    def __init__(self) -> None:
        super().__init__(
            name="review_agent",
            capabilities=["code_review", "analysis", "feedback"]
        )

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Execute code review task.

        Args:
            task_description: Description of what to review
            context: Additional context including:
                - files_changed: List of file paths that changed
                - diff: Git diff or file contents
                - task_type: Type of task (feature, bug, refactor)

        Returns:
            Review result with issues and assessment
        """
        task_id = f"review_{hash(task_description) % 10000}"
        self.start_task(task_id)

        logger.info("Starting code review", task=task_description, agent=self.name)

        # Extract context
        context = context or {}
        files_changed = context.get("files_changed", [])
        diff = context.get("diff", "")
        task_type = context.get("task_type", "general")

        # Perform review
        issues = await self._review_changes(
            files_changed=files_changed,
            diff=diff,
            task_type=task_type
        )

        # Generate summary
        summary = self._generate_summary(issues)

        # Determine approval
        approved = self._determine_approval(issues)

        # Create review result
        review_result = ReviewResult(
            review_id=task_id,
            agent_id=self.agent_id,
            task_id=task_id,
            timestamp=datetime.now().isoformat(),
            files_reviewed=files_changed,
            issues=issues,
            summary=summary,
            overall_assessment=self._generate_assessment(issues, approved),
            approved=approved
        )

        logger.info(
            "Code review complete",
            review_id=task_id,
            issues_count=len(issues),
            approved=approved,
            agent=self.name
        )

        # Return result
        return {
            "review_result": review_result.model_dump(),
            "task_output": self.get_task_output().model_dump()
        }

    async def _review_changes(
        self,
        files_changed: list[str],
        diff: str,
        task_type: str
    ) -> list[ReviewIssue]:
        """Review code changes and identify issues.

        Args:
            files_changed: List of changed files
            diff: Git diff or file contents
            task_type: Type of task

        Returns:
            List of issues found
        """
        issues = []

        # Review each file
        for file_path in files_changed:
            # Check file type and apply appropriate checks
            if file_path.endswith(".py"):
                issues.extend(await self._review_python_file(file_path, diff))
            elif file_path.endswith((".ts", ".tsx")):
                issues.extend(await self._review_typescript_file(file_path, diff))
            elif file_path.endswith(".sql"):
                issues.extend(await self._review_sql_file(file_path, diff))

        # Cross-file checks
        issues.extend(await self._review_cross_file(files_changed, diff, task_type))

        return issues

    async def _review_python_file(
        self,
        file_path: str,
        diff: str
    ) -> list[ReviewIssue]:
        """Review Python file for issues."""
        issues = []

        # Check for common Python issues
        # (In real implementation, would parse file and analyze)

        # Example checks:
        if "TODO" in diff or "FIXME" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.MAINTAINABILITY,
                severity=IssueSeverity.LOW,
                file_path=file_path,
                title="TODO/FIXME comments found",
                description="File contains TODO or FIXME comments that should be addressed",
                suggestion="Complete or remove TODO/FIXME comments before merging"
            ))

        if "except:" in diff and "except Exception:" not in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BUG,
                severity=IssueSeverity.HIGH,
                file_path=file_path,
                title="Bare except clause",
                description="Using bare except: can hide errors",
                suggestion="Catch specific exceptions instead of bare except:"
            ))

        if "time.sleep" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BUG,
                severity=IssueSeverity.HIGH,
                file_path=file_path,
                title="Blocking sleep in async context",
                description="time.sleep() blocks event loop in async code",
                suggestion="Use await asyncio.sleep() instead of time.sleep()"
            ))

        if "Any" in diff and "from typing import" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BEST_PRACTICE,
                severity=IssueSeverity.MEDIUM,
                file_path=file_path,
                title="Use of Any type",
                description="Using Any type reduces type safety",
                suggestion="Use specific types instead of Any where possible"
            ))

        return issues

    async def _review_typescript_file(
        self,
        file_path: str,
        diff: str
    ) -> list[ReviewIssue]:
        """Review TypeScript file for issues."""
        issues = []

        # Check for common TypeScript issues

        if "any" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BEST_PRACTICE,
                severity=IssueSeverity.MEDIUM,
                file_path=file_path,
                title="Use of any type",
                description="Using any type bypasses TypeScript's type checking",
                suggestion="Use specific types instead of any"
            ))

        if "console.log" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.MAINTAINABILITY,
                severity=IssueSeverity.LOW,
                file_path=file_path,
                title="Console.log statement",
                description="Debug console.log should be removed before merging",
                suggestion="Remove console.log or replace with proper logging"
            ))

        if "TODO" in diff or "FIXME" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.MAINTAINABILITY,
                severity=IssueSeverity.LOW,
                file_path=file_path,
                title="TODO/FIXME comments",
                description="File contains TODO or FIXME comments",
                suggestion="Complete or remove TODO/FIXME before merging"
            ))

        return issues

    async def _review_sql_file(
        self,
        file_path: str,
        diff: str
    ) -> list[ReviewIssue]:
        """Review SQL file for issues."""
        issues = []

        # Check for common SQL issues

        if "DROP TABLE" in diff and "IF EXISTS" not in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BUG,
                severity=IssueSeverity.CRITICAL,
                file_path=file_path,
                title="Unsafe DROP TABLE",
                description="DROP TABLE without IF EXISTS can fail if table doesn't exist",
                suggestion="Use DROP TABLE IF EXISTS for idempotency"
            ))

        if "BEGIN" not in diff and "COMMIT" not in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.BEST_PRACTICE,
                severity=IssueSeverity.MEDIUM,
                file_path=file_path,
                title="Missing transaction wrapper",
                description="Migration should be wrapped in BEGIN/COMMIT transaction",
                suggestion="Wrap migration in BEGIN; ... COMMIT;"
            ))

        if "SELECT *" in diff:
            issues.append(ReviewIssue(
                category=IssueCategory.PERFORMANCE,
                severity=IssueSeverity.LOW,
                file_path=file_path,
                title="SELECT * usage",
                description="SELECT * can hurt performance and readability",
                suggestion="Select specific columns instead of *"
            ))

        return issues

    async def _review_cross_file(
        self,
        files_changed: list[str],
        diff: str,
        task_type: str
    ) -> list[ReviewIssue]:
        """Review issues spanning multiple files."""
        issues = []

        # Check for missing tests
        has_test_files = any("test" in f for f in files_changed)
        has_implementation_files = any(
            f.endswith((".py", ".ts", ".tsx")) and "test" not in f
            for f in files_changed
        )

        if has_implementation_files and not has_test_files and task_type != "refactor":
            issues.append(ReviewIssue(
                category=IssueCategory.TESTING,
                severity=IssueSeverity.HIGH,
                file_path="(multiple)",
                title="Missing tests",
                description="Implementation changes without corresponding tests",
                suggestion="Add tests for new/changed functionality"
            ))

        # Check for large changes
        if len(files_changed) > 20:
            issues.append(ReviewIssue(
                category=IssueCategory.MAINTAINABILITY,
                severity=IssueSeverity.MEDIUM,
                file_path="(multiple)",
                title="Large changeset",
                description=(
                    f"PR touches {len(files_changed)} files, "
                    "may be too large to review effectively"
                ),
                suggestion="Consider breaking into smaller PRs"
            ))

        return issues

    def _generate_summary(self, issues: list[ReviewIssue]) -> dict[str, int]:
        """Generate summary of issues by severity."""
        summary = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0,
            "total": len(issues)
        }

        for issue in issues:
            summary[issue.severity.value] += 1

        return summary

    def _determine_approval(self, issues: list[ReviewIssue]) -> bool:
        """Determine if changes should be approved.

        Approval criteria:
        - No critical issues
        - No more than 2 high severity issues
        """
        critical_count = sum(1 for i in issues if i.severity == IssueSeverity.CRITICAL)
        high_count = sum(1 for i in issues if i.severity == IssueSeverity.HIGH)

        approved = critical_count == 0 and high_count <= 2

        return approved

    def _generate_assessment(
        self,
        issues: list[ReviewIssue],
        approved: bool
    ) -> str:
        """Generate overall assessment text."""
        if not issues:
            return "✅ Excellent! No issues found. Code looks great."

        if approved:
            return (
                f"✅ Approved with {len(issues)} minor issues. "
                "Please address the feedback but changes can proceed."
            )
        else:
            critical = sum(1 for i in issues if i.severity == IssueSeverity.CRITICAL)
            high = sum(1 for i in issues if i.severity == IssueSeverity.HIGH)

            if critical > 0:
                return (
                    f"❌ Changes cannot be merged. "
                    f"{critical} critical issue(s) must be fixed."
                )
            else:
                return (
                    f"⚠️ Changes need revision. "
                    f"{high} high-severity issue(s) should be addressed."
                )
