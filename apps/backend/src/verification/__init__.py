"""Verification module - Independent verification of task completion."""

from .independent_verifier import (
    ClaimedOutput,
    CompletionCriterion,
    IndependentVerifier,
    VerificationEvidence,
    VerificationFailure,
    VerificationRequest,
    VerificationResult,
    VerificationType,
)

__all__ = [
    "IndependentVerifier",
    "VerificationRequest",
    "VerificationResult",
    "VerificationEvidence",
    "VerificationFailure",
    "CompletionCriterion",
    "ClaimedOutput",
    "VerificationType",
]
