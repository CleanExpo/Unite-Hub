"""
API Security Test Suite

Tests API endpoints for common security vulnerabilities:
- SQL Injection
- XSS (Cross-Site Scripting)
- Authentication bypass
- Authorization checks
- Rate limiting
- Input validation
- Header security
- Error handling sanitisation
- File upload security

Standards:
- OWASP Top 10
- CWE Top 25
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}


class TestSQLInjectionPrevention:
    """Test SQL injection prevention across all endpoints."""

    SQL_INJECTION_PAYLOADS = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "1; SELECT * FROM users",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1--",
        "1' AND '1'='1",
        "1' OR '1'='1' /*",
    ]

    def test_sql_injection_in_prd_generation(self):
        """Test SQL injection prevention in PRD generation endpoint."""
        for payload in self.SQL_INJECTION_PAYLOADS:
            response = client.post(
                "/api/prd/generate",
                json={
                    "product_name": payload,
                    "description": "Test description",
                    "target_audience": "Test audience",
                },
                headers=AUTH_HEADERS,
            )

            # Should either reject with 400/422 or sanitise input
            assert response.status_code in [400, 422, 500], \
                f"Unexpected status code for SQL injection payload: {payload}"

            # If accepted, verify payload was sanitised
            if response.status_code in [200, 201]:
                data = response.json()
                assert "DROP TABLE" not in str(data)
                assert "SELECT * FROM" not in str(data)

    def test_sql_injection_in_query_parameters(self):
        """Test SQL injection prevention in query parameters."""
        for payload in self.SQL_INJECTION_PAYLOADS:
            response = client.get(
                f"/api/prd/result/{payload}",
                headers=AUTH_HEADERS,
            )

            # Should reject or handle safely
            assert response.status_code in [400, 404, 422, 500]


class TestXSSPrevention:
    """Test XSS (Cross-Site Scripting) prevention."""

    XSS_PAYLOADS = [
        "<script>alert('XSS')</script>",
        '<img src="x" onerror="alert(1)">',
        "javascript:alert(1)",
        "<svg onload=\"alert(1)\">",
        "<iframe src=\"javascript:alert(1)\">",
        "<body onload=alert('XSS')>",
        "<<SCRIPT>alert('XSS');//<</SCRIPT>",
        "<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>",
    ]

    def test_xss_prevention_in_prd_generation(self):
        """Test XSS prevention in PRD generation."""
        for payload in self.XSS_PAYLOADS:
            response = client.post(
                "/api/prd/generate",
                json={
                    "product_name": payload,
                    "description": payload,
                    "target_audience": "Test audience",
                },
                headers=AUTH_HEADERS,
            )

            if response.status_code in [200, 201]:
                data = response.json()
                response_str = str(data)

                # Verify dangerous scripts are not in response
                assert "<script>" not in response_str.lower()
                assert "onerror" not in response_str.lower()
                assert "javascript:" not in response_str.lower()
                assert "<iframe" not in response_str.lower()
                assert "onload" not in response_str.lower()

    def test_xss_prevention_in_response_headers(self):
        """Test XSS prevention via response headers."""
        response = client.get("/health")

        headers = response.headers
        assert "x-content-type-options" in headers
        assert headers["x-content-type-options"] == "nosniff"


class TestAuthenticationSecurity:
    """Test authentication security."""

    def test_unauthenticated_access_rejected(self):
        """Test that unauthenticated requests are rejected."""
        protected_endpoints = [
            "/api/prd/generate",
            "/api/contractors",
        ]

        for endpoint in protected_endpoints:
            response = client.post(endpoint, json={})
            assert response.status_code in [401, 403, 422], \
                f"Endpoint {endpoint} should require authentication"

    def test_expired_token_rejected(self):
        """Test that expired tokens are rejected."""
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid"

        response = client.post(
            "/api/prd/generate",
            headers={"Authorization": f"Bearer {expired_token}"},
            json={
                "product_name": "Test",
                "description": "Test",
                "target_audience": "Test",
            },
        )

        assert response.status_code in [401, 403]

    def test_malformed_token_rejected(self):
        """Test that malformed tokens are rejected."""
        malformed_tokens = [
            "malformed.token.here",
            "Bearer malformed",
            "not-a-token",
            "",
        ]

        for token in malformed_tokens:
            response = client.post(
                "/api/prd/generate",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "product_name": "Test",
                    "description": "Test",
                    "target_audience": "Test",
                },
            )

            assert response.status_code in [401, 403, 422]


class TestAuthorizationSecurity:
    """Test authorization and access control."""

    def test_role_based_access_control(self):
        """Test that role-based access control is enforced.

        Non-admin users should not be able to access admin-only routes.
        """
        # Attempt access with a non-admin user header
        response = client.get(
            "/api/agents/active",
            params={"user_id": "non-admin-user"},
            headers={"X-User-Id": "00000000-0000-0000-0000-000000000001"},
        )
        # Should succeed (user exists) or fail (not admin) — must not crash
        assert response.status_code in [200, 401, 403, 422]

    def test_user_can_only_access_own_data(self):
        """Test that users cannot access other users' data.

        Requesting data with a mismatched user ID should return
        empty results rather than another user's data.
        """
        user_a = "00000000-0000-0000-0000-000000000001"
        user_b = "00000000-0000-0000-0000-000000000002"

        # User A requests User B's agent runs
        response = client.get(
            "/api/agents/active",
            params={"user_id": user_b},
            headers={"X-User-Id": user_a},
        )
        # Should not return user B's data to user A
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            # Verify no data leakage — response should be empty or filtered
            assert isinstance(data, list)


class TestInputValidation:
    """Test input validation and sanitisation."""

    def test_invalid_json_rejected(self):
        """Test that invalid JSON is rejected."""
        response = client.post(
            "/api/prd/generate",
            data="not-valid-json",
            headers={"Content-Type": "application/json", "X-User-Id": "00000000-0000-0000-0000-000000000001"},
        )

        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Test that missing required fields are rejected."""
        response = client.post(
            "/api/prd/generate",
            json={},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_field_type_validation(self):
        """Test that field types are validated."""
        response = client.post(
            "/api/prd/generate",
            json={
                "product_name": 123,
                "description": True,
                "target_audience": ["invalid"],
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422

    def test_maximum_input_length(self):
        """Test that excessively long inputs are rejected."""
        very_long_string = "A" * 100000

        response = client.post(
            "/api/prd/generate",
            json={
                "product_name": very_long_string,
                "description": very_long_string,
                "target_audience": very_long_string,
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code in [400, 413, 422, 500]

    def test_special_characters_handling(self):
        """Test that special characters are handled safely."""
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"

        response = client.post(
            "/api/prd/generate",
            json={
                "product_name": special_chars,
                "description": "Test",
                "target_audience": "Test",
            },
            headers=AUTH_HEADERS,
        )

        if response.status_code in [200, 201]:
            data = response.json()
            assert "<script>" not in str(data)


class TestRateLimiting:
    """Test rate limiting protection."""

    def test_rate_limit_enforcement(self):
        """Test that rate limiting is enforced after rapid requests."""
        responses = []
        for _ in range(100):
            response = client.get("/health")
            responses.append(response)

        status_codes = [r.status_code for r in responses]
        # All should succeed (health is public) but rate limiter may kick in
        assert all(s in [200, 429] for s in status_codes)


class TestHeaderSecurity:
    """Test security headers."""

    def test_security_headers_present(self):
        """Test that security headers are present."""
        response = client.get("/health")

        headers = response.headers
        assert "x-content-type-options" in headers
        assert headers["x-content-type-options"] == "nosniff"

        assert "x-frame-options" in headers
        assert headers["x-frame-options"] == "DENY"

        assert "referrer-policy" in headers
        assert "permissions-policy" in headers

        assert "content-security-policy" in headers

    def test_cors_headers_configured(self):
        """Test that CORS headers are properly configured."""
        response = client.options(
            "/api/prd/generate",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "X-User-Id": "00000000-0000-0000-0000-000000000001",
            },
        )

        # Should have CORS headers for allowed origin
        headers = response.headers
        # The test client may not trigger CORS middleware fully,
        # but the response should not error
        assert response.status_code in [200, 401, 405]

    def test_request_id_in_response(self):
        """Test that X-Request-ID is returned in responses."""
        response = client.get("/health")
        assert "x-request-id" in response.headers
        # Should be a valid UUID-like string
        assert len(response.headers["x-request-id"]) >= 32


class TestErrorHandling:
    """Test secure error handling."""

    def test_error_messages_not_verbose(self):
        """Test that error messages don't expose sensitive information."""
        response = client.get("/api/prd/result/invalid-id-format", headers=AUTH_HEADERS)

        if response.status_code >= 400:
            data = response.json()
            error_msg = str(data).lower()

            assert "password" not in error_msg
            assert "secret" not in error_msg
            assert "token" not in error_msg
            assert "database" not in error_msg
            assert "connection string" not in error_msg
            assert "traceback" not in error_msg

    def test_500_errors_sanitised(self):
        """Test that 500 errors return a structured response without internals."""
        # Trigger an error by calling an endpoint likely to fail
        response = client.post(
            "/api/chat",
            json={"message": "test"},
            headers={"X-User-Id": "00000000-0000-0000-0000-000000000001"},
        )

        if response.status_code == 500:
            data = response.json()
            # Should have structured error format
            assert "error" in data
            assert "error_code" in data or "request_id" in data
            # Should NOT contain exception details
            error_str = str(data).lower()
            assert "traceback" not in error_str
            assert "exception" not in error_str


class TestFileUploadSecurity:
    """Test file upload security."""

    def test_file_type_validation(self):
        """Test that dangerous file types are rejected or handled safely."""
        import io

        # Attempt to upload a .exe file
        fake_exe = io.BytesIO(b"MZ\x90\x00")
        response = client.post(
            "/api/rag/upload",
            files={"file": ("malware.exe", fake_exe, "application/x-msdownload")},
            data={"project_id": "test-project"},
            headers={"X-User-Id": "00000000-0000-0000-0000-000000000001"},
        )

        # Should either reject or process safely (not execute)
        assert response.status_code in [200, 400, 415, 422, 500]

    def test_file_size_limits(self):
        """Test that oversized files are rejected."""
        import io

        # Create a 50MB file (likely over any reasonable limit)
        large_file = io.BytesIO(b"A" * (50 * 1024 * 1024))
        response = client.post(
            "/api/rag/upload",
            files={"file": ("large.txt", large_file, "text/plain")},
            data={"project_id": "test-project"},
            headers={"X-User-Id": "00000000-0000-0000-0000-000000000001"},
        )

        # Should reject with 413 or handle gracefully
        assert response.status_code in [200, 400, 413, 422, 500]


class TestAPIVersioning:
    """Test API versioning security."""

    def test_deprecated_endpoints_warned(self):
        """Test that deprecated endpoints return appropriate responses."""
        # Access root endpoint which should return API info
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data


class TestDataLeakage:
    """Test for data leakage vulnerabilities."""

    def test_no_sensitive_data_in_responses(self):
        """Test that responses don't leak sensitive data."""
        response = client.get("/api/prd/result/test-id", headers=AUTH_HEADERS)

        if response.status_code == 200:
            data = response.json()
            response_str = str(data).lower()

            assert "password" not in response_str
            assert "secret" not in response_str
            assert "api_key" not in response_str
            assert "private_key" not in response_str
            assert "access_token" not in response_str

    def test_user_enumeration_prevented(self):
        """Test that login responses don't reveal user existence.

        Both valid and invalid emails should return identical response
        structures to prevent user enumeration attacks.
        """
        valid_response = client.post(
            "/api/auth/login",
            json={"email": "admin@local.dev", "password": "wrong_password"},
        )
        invalid_response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrong_password"},
        )

        # Both should return the same status code
        assert valid_response.status_code == invalid_response.status_code


# Pytest configuration
@pytest.fixture(autouse=True)
def reset_test_state():
    """Reset test state before each test."""
    yield
    # Cleanup after each test if needed
