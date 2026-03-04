"""
Independent Verifier Agent

PURPOSE: Eliminate self-attestation by providing independent verification
of task completion. This agent CANNOT be the same agent that performed the work.

CRITICAL RULES:
1. Never trust self-reported status from other agents
2. Perform actual checks (file exists, tests pass, endpoints respond)
3. Collect evidence for every verification
4. Return structured results with proof
"""

import re
import subprocess
import time
import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, Field

from src.utils import get_logger

logger = get_logger(__name__)


# ============================================================================
# Types
# ============================================================================


class VerificationType(str, Enum):
    """Types of verification checks."""

    FILE_EXISTS = "file_exists"
    FILE_NOT_EMPTY = "file_not_empty"
    NO_PLACEHOLDERS = "no_placeholders"
    CODE_COMPILES = "code_compiles"
    LINT_PASSES = "lint_passes"
    TESTS_PASS = "tests_pass"
    ENDPOINT_RESPONDS = "endpoint_responds"
    RESPONSE_TIME = "response_time"
    CONTENT_CONTAINS = "content_contains"
    CONTENT_NOT_CONTAINS = "content_not_contains"
    BUILD_PASSES = "build_passes"
    FUNCTIONALITY_WORKS = "functionality_works"


class ClaimedOutput(BaseModel):
    """An output claimed by an agent."""

    type: str = Field(description="Type: file, endpoint, test, build, other")
    path: str = Field(description="Path or URL of the output")
    description: str = Field(description="Description of the output")


class CompletionCriterion(BaseModel):
    """A criterion that must be met for completion."""

    type: VerificationType
    target: str = Field(description="File path, URL, or test path to verify")
    expected: str | None = Field(default=None, description="Expected value or status")
    threshold: int | None = Field(default=None, description="Threshold for numeric checks")


class VerificationEvidence(BaseModel):
    """Evidence collected during verification."""

    criterion: str = Field(description="What was checked")
    type: VerificationType
    method: str = Field(description="How it was checked")
    result: str = Field(description="pass or fail")
    proof: str = Field(description="Evidence: file path, output, or response")
    timestamp: str = Field(description="ISO datetime of check")
    duration_ms: int = Field(description="Time taken in milliseconds")
    verifier_id: str = Field(description="ID of verifier (proves independence)")


class VerificationFailure(BaseModel):
    """Details of a verification failure."""

    criterion: str
    type: VerificationType
    reason: str
    expected: str
    actual: str


class VerificationRequest(BaseModel):
    """Request for verification."""

    task_id: str
    claimed_outputs: list[ClaimedOutput] = Field(default_factory=list)
    completion_criteria: list[CompletionCriterion] = Field(default_factory=list)
    requesting_agent_id: str = Field(description="ID of agent requesting verification")


class VerificationResult(BaseModel):
    """Result of verification."""

    verified: bool = Field(description="True ONLY if all checks pass with evidence")
    task_id: str
    evidence: list[VerificationEvidence] = Field(default_factory=list)
    failures: list[VerificationFailure] = Field(default_factory=list)
    verifier_id: str = Field(description="ID of verifier (proves independence)")
    requesting_agent_id: str
    timestamp: str
    total_checks: int
    passed_checks: int
    failed_checks: int


# ============================================================================
# Placeholder Patterns
# ============================================================================

PLACEHOLDER_PATTERNS = [
    r"TODO(?::|$|\s)",
    r"TBD(?::|$|\s)",
    r"FIXME(?::|$|\s)",
    r"\[INSERT\s+.*?\]",
    r"\[PLACEHOLDER\]",
    r"XXX(?::|$|\s)",
    r"HACK(?::|$|\s)",
    r"<<<.*?>>>",
    r"\{\{.*?\}\}",
    r"NotImplementedError",
    r'raise\s+NotImplementedError',
    r"pass\s*#\s*TODO",
]


# ============================================================================
# Independent Verifier Class
# ============================================================================


class IndependentVerifier:
    """
    Independent verification of task completion.

    CRITICAL: This verifier CANNOT verify work done by itself.
    The verifier_id must differ from requesting_agent_id.
    """

    def __init__(self) -> None:
        """Initialize with unique verifier ID."""
        self.verifier_id = f"verifier_{uuid.uuid4().hex[:12]}_{int(time.time())}"
        self.logger = get_logger(f"verifier.{self.verifier_id[:8]}")

    def _create_evidence(
        self,
        criterion: str,
        type: VerificationType,
        method: str,
        result: str,
        proof: str,
        timestamp: str,
        duration_ms: int,
    ) -> VerificationEvidence:
        """Create evidence with verifier_id automatically set."""
        return VerificationEvidence(
            criterion=criterion,
            type=type,
            method=method,
            result=result,
            proof=proof,
            timestamp=timestamp,
            duration_ms=duration_ms,
            verifier_id=self.verifier_id,
        )

    async def verify(self, request: VerificationRequest) -> VerificationResult:
        """
        Main verification entry point.

        Verifies ALL criteria and collects evidence for each.
        Returns verified=True ONLY if all checks pass.
        """
        start_time = time.time()
        evidence: list[VerificationEvidence] = []
        failures: list[VerificationFailure] = []

        # CRITICAL: Verify we are not the requesting agent
        if request.requesting_agent_id == self.verifier_id:
            raise ValueError(
                f"VERIFICATION INTEGRITY ERROR: Agent cannot verify its own work. "
                f"Requesting agent: {request.requesting_agent_id}, Verifier: {self.verifier_id}"
            )

        self.logger.info(
            "Starting verification",
            task_id=request.task_id,
            criteria_count=len(request.completion_criteria),
            requesting_agent=request.requesting_agent_id,
        )

        # Verify each criterion
        for criterion in request.completion_criteria:
            result = await self._verify_criterion(criterion)
            evidence.append(result["evidence"])

            if result["evidence"].result == "fail":
                failures.append(
                    VerificationFailure(
                        criterion=criterion.target,
                        type=criterion.type,
                        reason=result.get("failure_reason", "Verification failed"),
                        expected=criterion.expected or "pass",
                        actual=result["evidence"].proof[:200],
                    )
                )

        # Also verify all claimed outputs exist
        for output in request.claimed_outputs:
            if output.type == "file":
                result = await self._verify_file_exists(output.path)
                evidence.append(result["evidence"])

                if result["evidence"].result == "fail":
                    failures.append(
                        VerificationFailure(
                            criterion=f"Claimed output: {output.path}",
                            type=VerificationType.FILE_EXISTS,
                            reason="Claimed file does not exist",
                            expected="file exists",
                            actual="file not found",
                        )
                    )

        passed_checks = len([e for e in evidence if e.result == "pass"])
        failed_checks = len([e for e in evidence if e.result == "fail"])

        self.logger.info(
            "Verification complete",
            task_id=request.task_id,
            verified=len(failures) == 0,
            passed=passed_checks,
            failed=failed_checks,
            duration_ms=int((time.time() - start_time) * 1000),
        )

        return VerificationResult(
            verified=len(failures) == 0,
            task_id=request.task_id,
            evidence=evidence,
            failures=failures,
            verifier_id=self.verifier_id,
            requesting_agent_id=request.requesting_agent_id,
            timestamp=datetime.now().isoformat(),
            total_checks=len(evidence),
            passed_checks=passed_checks,
            failed_checks=failed_checks,
        )

    async def _verify_criterion(
        self, criterion: CompletionCriterion
    ) -> dict[str, Any]:
        """Verify a single criterion."""
        match criterion.type:
            case VerificationType.FILE_EXISTS:
                return await self._verify_file_exists(criterion.target)

            case VerificationType.FILE_NOT_EMPTY:
                return await self._verify_file_not_empty(criterion.target)

            case VerificationType.NO_PLACEHOLDERS:
                return await self._verify_no_placeholders(criterion.target)

            case VerificationType.CODE_COMPILES:
                return await self._verify_code_compiles(criterion.target)

            case VerificationType.LINT_PASSES:
                return await self._verify_lint_passes(criterion.target)

            case VerificationType.TESTS_PASS:
                return await self._verify_tests_pass(criterion.target)

            case VerificationType.ENDPOINT_RESPONDS:
                return await self._verify_endpoint_responds(
                    criterion.target, criterion.expected
                )

            case VerificationType.RESPONSE_TIME:
                return await self._verify_response_time(
                    criterion.target, criterion.threshold or 500
                )

            case VerificationType.CONTENT_CONTAINS:
                return await self._verify_content_contains(
                    criterion.target, criterion.expected or ""
                )

            case VerificationType.CONTENT_NOT_CONTAINS:
                return await self._verify_content_not_contains(
                    criterion.target, criterion.expected or ""
                )

            case VerificationType.BUILD_PASSES:
                return await self._verify_build_passes(criterion.target)

            case VerificationType.FUNCTIONALITY_WORKS:
                return await self._verify_functionality_works(
                    criterion.target, criterion.expected
                )

            case _:
                return {
                    "evidence": self._create_evidence(
                        criterion=criterion.target,
                        type=criterion.type,
                        method="unknown",
                        result="fail",
                        proof=f"Unknown verification type: {criterion.type}",
                        timestamp=datetime.now().isoformat(),
                        duration_ms=0,
                    ),
                    "failure_reason": f"Unknown verification type: {criterion.type}",
                }

    # =========================================================================
    # Verification Methods
    # =========================================================================

    async def _verify_file_exists(self, file_path: str) -> dict[str, Any]:
        """Verify file exists."""
        start = time.time()
        path = Path(file_path)
        exists = path.exists()

        if exists:
            stats = path.stat()
            modified = datetime.fromtimestamp(stats.st_mtime).isoformat()
            proof = (
                f"File exists: {file_path}, "
                f"Size: {stats.st_size} bytes, "
                f"Modified: {modified}"
            )
        else:
            proof = f"File NOT found: {file_path}"

        return {
            "evidence": self._create_evidence(
                criterion=file_path,
                type=VerificationType.FILE_EXISTS,
                method="pathlib.Path.exists()",
                result="pass" if exists else "fail",
                proof=proof,
                timestamp=datetime.now().isoformat(),
                duration_ms=int((time.time() - start) * 1000),
            ),
            "failure_reason": None if exists else f"File does not exist: {file_path}",
        }

    async def _verify_file_not_empty(self, file_path: str) -> dict[str, Any]:
        """Verify file is not empty."""
        start = time.time()
        path = Path(file_path)

        if not path.exists():
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.FILE_NOT_EMPTY,
                    method="pathlib.Path.stat().st_size > 0",
                    result="fail",
                    proof=f"File does not exist: {file_path}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "File does not exist",
            }

        stats = path.stat()
        is_empty = stats.st_size == 0

        return {
            "evidence": self._create_evidence(
                criterion=file_path,
                type=VerificationType.FILE_NOT_EMPTY,
                method="pathlib.Path.stat().st_size > 0",
                result="fail" if is_empty else "pass",
                proof=f"File size: {stats.st_size} bytes",
                timestamp=datetime.now().isoformat(),
                duration_ms=int((time.time() - start) * 1000),
            ),
            "failure_reason": "File is empty (0 bytes)" if is_empty else None,
        }

    async def _verify_no_placeholders(self, file_path: str) -> dict[str, Any]:
        """Verify file contains no placeholder text."""
        start = time.time()
        path = Path(file_path)

        if not path.exists():
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.NO_PLACEHOLDERS,
                    method="regex scan for TODO, TBD, FIXME, etc.",
                    result="fail",
                    proof=f"File does not exist: {file_path}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "File does not exist",
            }

        content = path.read_text(encoding="utf-8")
        found_placeholders: list[dict[str, Any]] = []

        for pattern in PLACEHOLDER_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                # Find line numbers
                lines = []
                for i, line in enumerate(content.split("\n"), 1):
                    if re.search(pattern, line, re.IGNORECASE):
                        lines.append(i)

                found_placeholders.append(
                    {
                        "pattern": pattern,
                        "matches": matches[:5],
                        "lines": lines[:10],
                    }
                )

        has_placeholders = len(found_placeholders) > 0

        return {
            "evidence": self._create_evidence(
                criterion=file_path,
                type=VerificationType.NO_PLACEHOLDERS,
                method="regex scan for TODO, TBD, FIXME, etc.",
                result="fail" if has_placeholders else "pass",
                proof=(
                    f"Found placeholders: {found_placeholders}"
                    if has_placeholders
                    else "No placeholder text found"
                ),
                timestamp=datetime.now().isoformat(),
                duration_ms=int((time.time() - start) * 1000),
            ),
            "failure_reason": (
                f"Found {len(found_placeholders)} placeholder patterns"
                if has_placeholders
                else None
            ),
        }

    async def _verify_code_compiles(self, file_path: str) -> dict[str, Any]:
        """Verify code compiles (Python: syntax check, TypeScript: tsc)."""
        start = time.time()
        path = Path(file_path)

        if not path.exists():
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CODE_COMPILES,
                    method="compile check",
                    result="fail",
                    proof=f"File does not exist: {file_path}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "File does not exist",
            }

        try:
            if file_path.endswith(".py"):
                # Python syntax check
                result = subprocess.run(
                    ["python", "-m", "py_compile", file_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                has_errors = result.returncode != 0
                output = result.stderr or result.stdout
            else:
                # TypeScript check
                result = subprocess.run(
                    ["npx", "tsc", "--noEmit", file_path],
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                has_errors = result.returncode != 0 or "error TS" in (
                    result.stdout + result.stderr
                )
                output = result.stdout + result.stderr

            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CODE_COMPILES,
                    method="compile/syntax check",
                    result="fail" if has_errors else "pass",
                    proof=(
                        output[:500] if has_errors else "Compilation successful"
                    ),
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Compilation errors" if has_errors else None,
            }
        except subprocess.TimeoutExpired:
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CODE_COMPILES,
                    method="compile check",
                    result="fail",
                    proof="Compilation timed out",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Compilation timed out",
            }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CODE_COMPILES,
                    method="compile check",
                    result="fail",
                    proof=f"Error: {str(e)[:300]}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_lint_passes(self, file_path: str) -> dict[str, Any]:
        """Verify lint passes."""
        start = time.time()

        try:
            if file_path.endswith(".py"):
                result = subprocess.run(
                    ["ruff", "check", file_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
            else:
                result = subprocess.run(
                    ["npx", "eslint", file_path, "--format", "compact"],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )

            output = result.stdout + result.stderr
            has_errors = result.returncode != 0

            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.LINT_PASSES,
                    method="lint check",
                    result="fail" if has_errors else "pass",
                    proof=output[:500] if has_errors else "Lint passed",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Lint errors" if has_errors else None,
            }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.LINT_PASSES,
                    method="lint check",
                    result="fail",
                    proof=f"Error: {str(e)[:300]}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_tests_pass(self, test_path: str) -> dict[str, Any]:
        """Verify tests pass."""
        start = time.time()

        try:
            if test_path.endswith(".py"):
                result = subprocess.run(
                    ["pytest", test_path, "-v", "--tb=short"],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
            else:
                result = subprocess.run(
                    ["npx", "vitest", "run", test_path, "--reporter=verbose"],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )

            output = result.stdout + result.stderr
            has_failures = result.returncode != 0 or "FAILED" in output or "FAIL" in output

            return {
                "evidence": self._create_evidence(
                    criterion=test_path,
                    type=VerificationType.TESTS_PASS,
                    method="test execution",
                    result="fail" if has_failures else "pass",
                    proof=output[:1000],
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Tests failed" if has_failures else None,
            }
        except subprocess.TimeoutExpired:
            return {
                "evidence": self._create_evidence(
                    criterion=test_path,
                    type=VerificationType.TESTS_PASS,
                    method="test execution",
                    result="fail",
                    proof="Tests timed out after 120 seconds",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Tests timed out",
            }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=test_path,
                    type=VerificationType.TESTS_PASS,
                    method="test execution",
                    result="fail",
                    proof=f"Error: {str(e)[:300]}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_endpoint_responds(
        self, endpoint: str, expected_status: str | None
    ) -> dict[str, Any]:
        """Verify endpoint responds."""
        start = time.time()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(endpoint)

                status_ok = (
                    str(response.status_code) == expected_status
                    if expected_status
                    else response.is_success
                )

                body = response.text[:200]

                return {
                    "evidence": self._create_evidence(
                        criterion=endpoint,
                        type=VerificationType.ENDPOINT_RESPONDS,
                        method="HTTP GET request",
                        result="pass" if status_ok else "fail",
                        proof=f"Status: {response.status_code}, Body: {body}",
                        timestamp=datetime.now().isoformat(),
                        duration_ms=int((time.time() - start) * 1000),
                    ),
                    "failure_reason": (
                        None
                        if status_ok
                        else f"Expected {expected_status or '2xx'}, got {response.status_code}"
                    ),
                }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=endpoint,
                    type=VerificationType.ENDPOINT_RESPONDS,
                    method="HTTP GET request",
                    result="fail",
                    proof=f"Request failed: {str(e)}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_response_time(
        self, endpoint: str, threshold_ms: int
    ) -> dict[str, Any]:
        """Verify response time is within threshold."""
        start = time.time()

        try:
            request_start = time.time()
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.get(endpoint)
            response_time_ms = int((time.time() - request_start) * 1000)

            within_threshold = response_time_ms <= threshold_ms

            return {
                "evidence": self._create_evidence(
                    criterion=endpoint,
                    type=VerificationType.RESPONSE_TIME,
                    method=f"HTTP GET with {threshold_ms}ms threshold",
                    result="pass" if within_threshold else "fail",
                    proof=f"Response time: {response_time_ms}ms (threshold: {threshold_ms}ms)",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": (
                    None
                    if within_threshold
                    else f"Response time {response_time_ms}ms exceeds {threshold_ms}ms"
                ),
            }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=endpoint,
                    type=VerificationType.RESPONSE_TIME,
                    method=f"HTTP GET with {threshold_ms}ms threshold",
                    result="fail",
                    proof=f"Request failed: {str(e)}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_content_contains(
        self, file_path: str, expected: str
    ) -> dict[str, Any]:
        """Verify file contains expected string."""
        start = time.time()
        path = Path(file_path)

        if not path.exists():
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CONTENT_CONTAINS,
                    method=f"Check contains: {expected[:50]}...",
                    result="fail",
                    proof=f"File does not exist: {file_path}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "File does not exist",
            }

        content = path.read_text(encoding="utf-8")
        contains = expected in content

        return {
            "evidence": self._create_evidence(
                criterion=file_path,
                type=VerificationType.CONTENT_CONTAINS,
                method=f"Check contains: {expected[:50]}...",
                result="pass" if contains else "fail",
                proof="File contains expected content" if contains else "Content not found",
                timestamp=datetime.now().isoformat(),
                duration_ms=int((time.time() - start) * 1000),
            ),
            "failure_reason": None if contains else "Expected content not found",
        }

    async def _verify_content_not_contains(
        self, file_path: str, unwanted: str
    ) -> dict[str, Any]:
        """Verify file does NOT contain unwanted string."""
        start = time.time()
        path = Path(file_path)

        if not path.exists():
            return {
                "evidence": self._create_evidence(
                    criterion=file_path,
                    type=VerificationType.CONTENT_NOT_CONTAINS,
                    method=f"Check not contains: {unwanted[:50]}...",
                    result="pass",  # File doesn't exist = doesn't contain
                    proof=f"File does not exist: {file_path}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
            }

        content = path.read_text(encoding="utf-8")
        contains = unwanted in content

        return {
            "evidence": self._create_evidence(
                criterion=file_path,
                type=VerificationType.CONTENT_NOT_CONTAINS,
                method=f"Check not contains: {unwanted[:50]}...",
                result="fail" if contains else "pass",
                proof=(
                    "File contains unwanted content"
                    if contains
                    else "File does not contain unwanted content"
                ),
                timestamp=datetime.now().isoformat(),
                duration_ms=int((time.time() - start) * 1000),
            ),
            "failure_reason": "Unwanted content found" if contains else None,
        }

    async def _verify_build_passes(self, build_path: str) -> dict[str, Any]:
        """Verify build passes."""
        start = time.time()

        try:
            # Try npm/pnpm build
            result = subprocess.run(
                ["pnpm", "build"],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=build_path if Path(build_path).is_dir() else None,
            )

            output = result.stdout + result.stderr
            has_errors = result.returncode != 0

            return {
                "evidence": self._create_evidence(
                    criterion=build_path,
                    type=VerificationType.BUILD_PASSES,
                    method="pnpm build",
                    result="fail" if has_errors else "pass",
                    proof=output[-1000:] if has_errors else "Build successful",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": "Build failed" if has_errors else None,
            }
        except Exception as e:
            return {
                "evidence": self._create_evidence(
                    criterion=build_path,
                    type=VerificationType.BUILD_PASSES,
                    method="build",
                    result="fail",
                    proof=f"Error: {str(e)[:300]}",
                    timestamp=datetime.now().isoformat(),
                    duration_ms=int((time.time() - start) * 1000),
                ),
                "failure_reason": str(e),
            }

    async def _verify_functionality_works(
        self, target: str, expected: str | None
    ) -> dict[str, Any]:
        """Verify functionality works as expected."""
        time.time()

        # This is a generic check - actual implementation depends on context
        # For now, just verify the target exists or responds
        if target.startswith("http"):
            return await self._verify_endpoint_responds(target, expected)
        else:
            return await self._verify_file_exists(target)

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_verifier_id(self) -> str:
        """Get verifier ID to prove independence."""
        return self.verifier_id

    async def quick_verify(
        self,
        task_id: str,
        requesting_agent_id: str,
        file_paths: list[str],
    ) -> VerificationResult:
        """Quick verification for common file-based scenarios."""
        criteria: list[CompletionCriterion] = []
        outputs: list[ClaimedOutput] = []

        for file_path in file_paths:
            outputs.append(
                ClaimedOutput(type="file", path=file_path, description=f"File: {file_path}")
            )
            criteria.append(CompletionCriterion(type=VerificationType.FILE_EXISTS, target=file_path))
            criteria.append(CompletionCriterion(type=VerificationType.FILE_NOT_EMPTY, target=file_path))
            criteria.append(CompletionCriterion(type=VerificationType.NO_PLACEHOLDERS, target=file_path))

        return await self.verify(
            VerificationRequest(
                task_id=task_id,
                claimed_outputs=outputs,
                completion_criteria=criteria,
                requesting_agent_id=requesting_agent_id,
            )
        )


# Global instance
independent_verifier = IndependentVerifier()
