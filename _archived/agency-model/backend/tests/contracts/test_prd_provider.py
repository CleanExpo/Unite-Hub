"""
Pact Provider Verification Tests - PRD API

These tests verify that the FastAPI backend (provider) fulfills
the contract defined by the Next.js frontend (consumer).

Installation:
    uv add --dev pact-python

Run tests:
    pytest tests/contracts/test_prd_provider.py -v

Pact Broker:
    Set PACT_BROKER_URL and PACT_BROKER_TOKEN env vars
    Or place pact files in ../../../web/pacts/

How it works:
    1. Consumer (web) generates pact file with expected interactions
    2. Provider (backend) verifies it can fulfill those interactions
    3. If provider changes break the contract, tests fail
    4. Prevents breaking changes between frontend and backend
"""

import pytest
import os
from pathlib import Path
from pact import Verifier
from fastapi.testclient import TestClient
from src.api.main import app


# Provider verification configuration
PACT_FILE_PATH = Path(__file__).parent.parent.parent.parent / "web" / "pacts"
PACT_BROKER_URL = os.getenv("PACT_BROKER_URL", "")
PACT_BROKER_TOKEN = os.getenv("PACT_BROKER_TOKEN", "")

# Test client for FastAPI app
client = TestClient(app)


@pytest.fixture
def provider_url():
    """Return the provider URL for verification."""
    return "http://localhost:8000"


@pytest.fixture
def pact_verifier():
    """Create a Pact verifier instance."""
    return Verifier(
        provider="backend-api",
        provider_base_url="http://localhost:8000",
    )


class TestPRDProviderContract:
    """Test that the backend API fulfills the consumer contract."""

    def test_verify_pact_with_consumer(self, pact_verifier, provider_url):
        """
        Verify that the provider (backend) fulfills the contract
        defined by the consumer (web frontend).
        """
        # Provider states configuration
        # These correspond to the .given() states in consumer tests
        provider_states = {
            "the PRD generation service is available": self._setup_prd_service_available,
            "a PRD generation is in progress": self._setup_prd_in_progress,
            "no PRD generation exists for the run_id": self._setup_no_prd_exists,
            "a PRD has been successfully generated": self._setup_prd_completed,
            "documents have been generated for the PRD": self._setup_documents_generated,
            "the API is running": self._setup_api_running,
        }

        # Verify against pact files or broker
        if PACT_BROKER_URL:
            # Verify from Pact Broker
            success, logs = pact_verifier.verify_with_broker(
                broker_url=PACT_BROKER_URL,
                broker_token=PACT_BROKER_TOKEN,
                provider_states_setup_url=f"{provider_url}/_pact/provider-states",
                enable_pending=True,  # Allow pending pacts
                publish_version="1.0.0",
                publish_verification_results=True,
            )
        else:
            # Verify from local pact files
            pact_files = list(PACT_FILE_PATH.glob("*.json"))

            if not pact_files:
                pytest.skip("No pact files found. Run consumer tests first.")

            success, logs = pact_verifier.verify_pacts(
                *[str(f) for f in pact_files],
                provider_states_setup_url=f"{provider_url}/_pact/provider-states",
            )

        assert success == 0, f"Pact verification failed:\n{logs}"

    # Provider State Setup Methods
    # These methods set up the backend state for each consumer scenario

    def _setup_prd_service_available(self):
        """Set up: PRD generation service is available."""
        # Ensure service is running and healthy
        # Mock or set up any required dependencies
        pass

    def _setup_prd_in_progress(self):
        """Set up: A PRD generation is in progress."""
        # Create a mock PRD run with status 'in_progress'
        # Insert into database or mock the state
        pass

    def _setup_no_prd_exists(self):
        """Set up: No PRD generation exists for the run_id."""
        # Ensure no PRD exists for the test run_id
        # Clean database or mock empty state
        pass

    def _setup_prd_completed(self):
        """Set up: A PRD has been successfully generated."""
        # Create a completed PRD with full content
        # Insert into database or mock the completed state
        pass

    def _setup_documents_generated(self):
        """Set up: Documents have been generated for the PRD."""
        # Create document records associated with a PRD
        # Mock file storage or database records
        pass

    def _setup_api_running(self):
        """Set up: The API is running."""
        # Ensure API health check endpoint is functional
        pass


class TestProviderStateEndpoint:
    """Test the provider states endpoint used by Pact verification."""

    def test_provider_states_endpoint_exists(self):
        """Test that provider states endpoint is available."""
        # This endpoint is called by Pact to set up provider states
        # You need to implement this endpoint in your FastAPI app

        response = client.post(
            "/_pact/provider-states",
            json={"state": "the PRD generation service is available"},
        )

        # Should return 200 or 201 when state is set up successfully
        assert response.status_code in [200, 201, 204]


# Example: Provider States Endpoint Implementation
# Add this to your FastAPI app (src/api/main.py or a separate router):

"""
from fastapi import APIRouter

pact_router = APIRouter(prefix="/_pact", tags=["pact"])

@pact_router.post("/provider-states")
async def setup_provider_state(state: dict):
    '''
    Endpoint to set up provider states for Pact verification.
    Called by Pact verifier before each interaction.
    '''
    state_name = state.get("state")

    # Set up the appropriate state based on state_name
    if state_name == "the PRD generation service is available":
        # Set up clean state
        pass
    elif state_name == "a PRD generation is in progress":
        # Create in-progress PRD
        pass
    # ... other states

    return {"result": "provider state set up"}

# Register in main app:
# app.include_router(pact_router)
"""


# Integration with CI/CD
# Add to .github/workflows/ci.yml:

"""
contract-tests:
  name: Contract Tests
  runs-on: ubuntu-latest
  needs: [frontend-tests, backend-tests]

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'

    - name: Install dependencies
      run: |
        pnpm install
        cd apps/backend && uv sync

    - name: Run consumer contract tests (generate pacts)
      working-directory: apps/web
      run: pnpm test:contracts

    - name: Start backend provider
      working-directory: apps/backend
      run: |
        uv run uvicorn src.api.main:app --port 8000 &
        sleep 5

    - name: Run provider verification tests
      working-directory: apps/backend
      run: uv run pytest tests/contracts/ -v

    - name: Publish pacts to broker (optional)
      if: github.ref == 'refs/heads/main'
      env:
        PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
        PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      run: |
        pnpm exec pact-broker publish \
          apps/web/pacts \
          --consumer-app-version=${{ github.sha }} \
          --branch=${{ github.ref_name }}
"""
