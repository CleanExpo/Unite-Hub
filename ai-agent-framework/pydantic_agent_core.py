"""
Pydantic Agent Core - Main Agent Framework
Following test-driven development with Docker validation
"""

import logging
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

from pydantic import BaseModel, Field, validator
import docker
from rich.console import Console
from rich.logging import RichHandler
from rich.table import Table
from rich.panel import Panel

# Configure rich logging
console = Console()
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(console=console, rich_tracebacks=True)]
)
logger = logging.getLogger("PydanticAgent")

class PhaseStatus(str, Enum):
    """Phase execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    COMPLETE = "complete"
    FAILED = "failed"

class TestResult(BaseModel):
    """Test execution result schema"""
    test_name: str = Field(..., description="Name of the test")
    status: str = Field(..., description="Test status: passed, failed, skipped")
    duration: float = Field(..., description="Test execution time in seconds")
    error_message: Optional[str] = Field(None, description="Error message if test failed")
    stdout: Optional[str] = Field(None, description="Test output")
    stderr: Optional[str] = Field(None, description="Test error output")

class DockerTestConfig(BaseModel):
    """Docker test configuration schema"""
    image: str = Field("python:3.11-slim", description="Docker image to use")
    dockerfile_path: str = Field("./Dockerfile.test", description="Path to test Dockerfile")
    test_command: str = Field("python -m pytest", description="Command to run tests")
    volume_mounts: List[str] = Field(default_factory=list, description="Volume mounts for Docker")
    environment_vars: Dict[str, str] = Field(default_factory=dict, description="Environment variables")

class PhaseConfig(BaseModel):
    """Phase configuration schema"""
    name: str = Field(..., description="Phase name")
    description: str = Field(..., description="Phase description")
    dependencies: List[str] = Field(default_factory=list, description="Required previous phases")
    tests_required: bool = Field(True, description="Whether tests are required for this phase")
    docker_validation: bool = Field(True, description="Whether Docker validation is required")
    approval_required: bool = Field(True, description="Whether human approval is required")

class AgentState(BaseModel):
    """Current agent state schema"""
    current_phase: Optional[str] = Field(None, description="Current phase name")
    phase_status: PhaseStatus = Field(PhaseStatus.PENDING, description="Current phase status")
    completed_phases: List[str] = Field(default_factory=list, description="List of completed phases")
    test_results: List[TestResult] = Field(default_factory=list, description="Test execution results")
    last_update: datetime = Field(default_factory=datetime.now, description="Last state update")
    roadmap_version: str = Field("1.0.0", description="Current roadmap version")

class RoadmapItem(BaseModel):
    """Roadmap item schema"""
    id: str = Field(..., description="Unique identifier")
    title: str = Field(..., description="Item title")
    description: str = Field(..., description="Detailed description")
    status: PhaseStatus = Field(PhaseStatus.PENDING, description="Current status")
    priority: int = Field(1, description="Priority level (1=highest, 5=lowest)")
    estimated_hours: int = Field(1, description="Estimated development hours")
    dependencies: List[str] = Field(default_factory=list, description="Dependency IDs")
    tags: List[str] = Field(default_factory=list, description="Classification tags")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class AgentResponse(BaseModel):
    """Standard agent response schema"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Human-readable message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    phase: Optional[str] = Field(None, description="Current phase")
    next_actions: List[str] = Field(default_factory=list, description="Suggested next actions")

class PydanticAgent:
    """
    Main Pydantic Agent class implementing test-driven development workflow
    """
    
    def __init__(self, project_path: str = ".", config_file: str = "agent_config.json"):
        self.project_path = Path(project_path)
        self.config_file = self.project_path / config_file
        self.state_file = self.project_path / "agent_state.json"
        self.roadmap_file = self.project_path / "roadmap.json"
        
        # Load or initialize configuration
        self.config = self._load_config()
        self.state = self._load_state()
        self.roadmap = self._load_roadmap()
        
        # Initialize Docker client
        try:
            self.docker_client = docker.from_env()
            logger.info("✅ Docker client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Docker client: {e}")
            self.docker_client = None

    def _load_config(self) -> Dict[str, Any]:
        """Load agent configuration"""
        default_config = {
            "phases": [
                {
                    "name": "foundation",
                    "description": "Set up project foundation and core structure",
                    "dependencies": [],
                    "tests_required": True,
                    "docker_validation": True,
                    "approval_required": True
                },
                {
                    "name": "implementation",
                    "description": "Implement core functionality",
                    "dependencies": ["foundation"],
                    "tests_required": True,
                    "docker_validation": True,
                    "approval_required": True
                },
                {
                    "name": "integration",
                    "description": "Integrate components and test end-to-end",
                    "dependencies": ["implementation"],
                    "tests_required": True,
                    "docker_validation": True,
                    "approval_required": True
                },
                {
                    "name": "deployment",
                    "description": "Deploy to production environment",
                    "dependencies": ["integration"],
                    "tests_required": True,
                    "docker_validation": False,
                    "approval_required": True
                }
            ],
            "docker_test": {
                "image": "python:3.11-slim",
                "dockerfile_path": "./Dockerfile.test",
                "test_command": "python -m pytest -v",
                "volume_mounts": ["./:/app"],
                "environment_vars": {"PYTHONPATH": "/app"}
            }
        }
        
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                return json.load(f)
        else:
            with open(self.config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config

    def _load_state(self) -> AgentState:
        """Load current agent state"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                # Convert datetime strings back to datetime objects
                if 'last_update' in data:
                    data['last_update'] = datetime.fromisoformat(data['last_update'])
                return AgentState(**data)
        else:
            return AgentState()

    def _save_state(self):
        """Save current agent state"""
        state_dict = self.state.dict()
        # Convert datetime objects to strings for JSON serialization
        state_dict['last_update'] = self.state.last_update.isoformat()
        
        with open(self.state_file, 'w') as f:
            json.dump(state_dict, f, indent=2)

    def _load_roadmap(self) -> List[RoadmapItem]:
        """Load project roadmap"""
        default_roadmap = [
            {
                "id": "blog-template-foundation",
                "title": "Blog Template Foundation",
                "description": "Complete ModernBlogPostTemplate implementation with SEO optimization",
                "status": "complete",
                "priority": 1,
                "estimated_hours": 8,
                "dependencies": [],
                "tags": ["template", "blog", "seo"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "blog-content-creation",
                "title": "Blog Content Creation",
                "description": "Create professional blog posts using the template",
                "status": "complete",
                "priority": 1,
                "estimated_hours": 4,
                "dependencies": ["blog-template-foundation"],
                "tags": ["content", "blog", "marketing"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "agent-framework-setup",
                "title": "Pydantic Agent Framework Setup",
                "description": "Implement test-driven development framework with Docker validation",
                "status": "in_progress",
                "priority": 1,
                "estimated_hours": 6,
                "dependencies": ["blog-content-creation"],
                "tags": ["framework", "testing", "automation"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]
        
        if self.roadmap_file.exists():
            with open(self.roadmap_file, 'r') as f:
                data = json.load(f)
                return [RoadmapItem(**item) for item in data]
        else:
            roadmap_items = [RoadmapItem(**item) for item in default_roadmap]
            self._save_roadmap(roadmap_items)
            return roadmap_items

    def _save_roadmap(self, roadmap: List[RoadmapItem]):
        """Save project roadmap"""
        roadmap_dict = [item.dict() for item in roadmap]
        # Convert datetime objects to strings
        for item in roadmap_dict:
            item['created_at'] = item['created_at'].isoformat() if isinstance(item['created_at'], datetime) else item['created_at']
            item['updated_at'] = item['updated_at'].isoformat() if isinstance(item['updated_at'], datetime) else item['updated_at']
        
        with open(self.roadmap_file, 'w') as f:
            json.dump(roadmap_dict, f, indent=2)

    def init_phase(self, phase_name: str) -> AgentResponse:
        """
        Initialize a new development phase
        """
        logger.info(f"🚀 Initializing phase: {phase_name}")
        
        # Validate phase exists in configuration
        phase_configs = {p['name']: PhaseConfig(**p) for p in self.config['phases']}
        
        if phase_name not in phase_configs:
            return AgentResponse(
                success=False,
                message=f"❌ Phase '{phase_name}' not found in configuration",
                phase=self.state.current_phase
            )
        
        phase_config = phase_configs[phase_name]
        
        # Check dependencies
        missing_deps = [dep for dep in phase_config.dependencies if dep not in self.state.completed_phases]
        if missing_deps:
            return AgentResponse(
                success=False,
                message=f"❌ Missing dependencies: {', '.join(missing_deps)}",
                phase=self.state.current_phase,
                next_actions=[f"Complete phase: {dep}" for dep in missing_deps]
            )
        
        # Update state
        self.state.current_phase = phase_name
        self.state.phase_status = PhaseStatus.IN_PROGRESS
        self.state.last_update = datetime.now()
        self._save_state()
        
        # Display phase information
        panel = Panel(
            f"[bold green]Phase: {phase_name}[/bold green]\n"
            f"[yellow]Description:[/yellow] {phase_config.description}\n"
            f"[yellow]Tests Required:[/yellow] {'✅' if phase_config.tests_required else '❌'}\n"
            f"[yellow]Docker Validation:[/yellow] {'✅' if phase_config.docker_validation else '❌'}\n"
            f"[yellow]Approval Required:[/yellow] {'✅' if phase_config.approval_required else '❌'}",
            title="🚀 Phase Initialized",
            border_style="green"
        )
        console.print(panel)
        
        return AgentResponse(
            success=True,
            message=f"✅ Phase '{phase_name}' initialized successfully",
            phase=phase_name,
            next_actions=["Run generate_tests() to create test suite", "Implement phase functionality", "Run run_docker_tests() for validation"]
        )

    def generate_tests(self, test_type: str = "unit") -> AgentResponse:
        """
        Generate test suite for current phase
        """
        if not self.state.current_phase:
            return AgentResponse(
                success=False,
                message="❌ No active phase. Run init_phase() first.",
                next_actions=["Initialize a phase with init_phase()"]
            )
        
        logger.info(f"🧪 Generating {test_type} tests for phase: {self.state.current_phase}")
        
        # Create test directory structure
        test_dir = self.project_path / "tests" / self.state.current_phase
        test_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate test files based on phase
        test_files = self._generate_test_files(test_dir, test_type)
        
        # Generate Docker test configuration
        self._generate_docker_test_config()
        
        panel = Panel(
            f"[bold green]Test Generation Complete[/bold green]\n"
            f"[yellow]Phase:[/yellow] {self.state.current_phase}\n"
            f"[yellow]Test Type:[/yellow] {test_type}\n"
            f"[yellow]Files Created:[/yellow] {len(test_files)}\n"
            f"[yellow]Test Directory:[/yellow] {test_dir}",
            title="🧪 Tests Generated",
            border_style="blue"
        )
        console.print(panel)
        
        return AgentResponse(
            success=True,
            message=f"✅ Generated {len(test_files)} test files for {self.state.current_phase}",
            phase=self.state.current_phase,
            data={"test_files": test_files, "test_directory": str(test_dir)},
            next_actions=["Review generated tests", "Run run_docker_tests() to validate"]
        )

    def _generate_test_files(self, test_dir: Path, test_type: str) -> List[str]:
        """Generate test files for the current phase"""
        test_files = []
        
        if self.state.current_phase == "foundation":
            # Foundation phase tests
            test_files.extend(self._create_foundation_tests(test_dir))
        elif self.state.current_phase == "implementation":
            # Implementation phase tests
            test_files.extend(self._create_implementation_tests(test_dir))
        elif self.state.current_phase == "integration":
            # Integration phase tests
            test_files.extend(self._create_integration_tests(test_dir))
        elif self.state.current_phase == "deployment":
            # Deployment phase tests
            test_files.extend(self._create_deployment_tests(test_dir))
        
        return test_files

    def _create_foundation_tests(self, test_dir: Path) -> List[str]:
        """Create foundation phase tests"""
        test_files = []
        
        # Test blog template functionality
        blog_test_file = test_dir / "test_blog_template.py"
        with open(blog_test_file, 'w') as f:
            f.write('''
"""
Foundation Phase Tests - Blog Template
"""
import pytest
import os
from pathlib import Path

class TestBlogTemplate:
    """Test blog template foundation"""
    
    def test_template_files_exist(self):
        """Test that required template files exist"""
        template_dir = Path("src/templates")
        assert template_dir.exists(), "Template directory should exist"
        
        required_files = [
            "ModernBlogPostTemplate.tsx",
            "README.md"
        ]
        
        for file in required_files:
            file_path = template_dir / file
            assert file_path.exists(), f"Required file {file} should exist"
    
    def test_blog_posts_exist(self):
        """Test that blog posts were created"""
        blog_dir = Path("src/blog")
        assert blog_dir.exists(), "Blog directory should exist"
        
        required_posts = [
            "stop-losing-customers-tech-headaches.tsx",
            "3-signs-smarter-app-connections.tsx"
        ]
        
        for post in required_posts:
            post_path = blog_dir / post
            assert post_path.exists(), f"Blog post {post} should exist"
    
    def test_template_exports(self):
        """Test that template exports required components"""
        # This would require actual TypeScript compilation
        # For now, we'll test file content
        template_file = Path("src/templates/ModernBlogPostTemplate.tsx")
        content = template_file.read_text()
        
        required_exports = [
            "export default ModernBlogPostTemplate",
            "export { Callout, CodeBlock, BlogChart }",
            "export interface BlogPostMeta"
        ]
        
        for export in required_exports:
            assert export in content, f"Template should export {export}"

    def test_documentation_complete(self):
        """Test that documentation is complete"""
        docs = [
            "src/templates/README.md",
            "BLOG_TEMPLATE_SCAFFOLD_SUMMARY.md"
        ]
        
        for doc in docs:
            doc_path = Path(doc)
            assert doc_path.exists(), f"Documentation {doc} should exist"
            assert doc_path.stat().st_size > 1000, f"Documentation {doc} should have substantial content"
''')
        test_files.append(str(blog_test_file))
        
        return test_files

    def _create_implementation_tests(self, test_dir: Path) -> List[str]:
        """Create implementation phase tests"""
        test_files = []
        
        # Agent framework tests
        agent_test_file = test_dir / "test_agent_framework.py"
        with open(agent_test_file, 'w') as f:
            f.write('''
"""
Implementation Phase Tests - Agent Framework
"""
import pytest
from pathlib import Path
import json

class TestAgentFramework:
    """Test agent framework implementation"""
    
    def test_agent_files_exist(self):
        """Test that agent framework files exist"""
        framework_dir = Path("ai-agent-framework")
        assert framework_dir.exists(), "Agent framework directory should exist"
        
        required_files = [
            "pydantic_agent_core.py",
            "requirements.txt"
        ]
        
        for file in required_files:
            file_path = framework_dir / file
            assert file_path.exists(), f"Required file {file} should exist"
    
    def test_pydantic_models(self):
        """Test that Pydantic models are properly defined"""
        agent_file = Path("ai-agent-framework/pydantic_agent_core.py")
        content = agent_file.read_text()
        
        required_models = [
            "class AgentState(BaseModel)",
            "class TestResult(BaseModel)",
            "class RoadmapItem(BaseModel)",
            "class AgentResponse(BaseModel)"
        ]
        
        for model in required_models:
            assert model in content, f"Should define {model}"
    
    def test_agent_commands(self):
        """Test that all required agent commands exist"""
        agent_file = Path("ai-agent-framework/pydantic_agent_core.py")
        content = agent_file.read_text()
        
        required_commands = [
            "def init_phase(",
            "def generate_tests(",
            "def run_docker_tests(",
            "def report_status(",
            "def update_roadmap("
        ]
        
        for command in required_commands:
            assert command in content, f"Should implement {command}"
''')
        test_files.append(str(agent_test_file))
        
        return test_files

    def _create_integration_tests(self, test_dir: Path) -> List[str]:
        """Create integration phase tests"""
        test_files = []
        
        integration_test_file = test_dir / "test_integration.py"
        with open(integration_test_file, 'w') as f:
            f.write('''
"""
Integration Phase Tests
"""
import pytest
import subprocess
from pathlib import Path

class TestIntegration:
    """Test system integration"""
    
    def test_build_succeeds(self):
        """Test that the project builds successfully"""
        result = subprocess.run(
            ["npm", "run", "build"],
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        
        # Allow warnings but not errors
        assert result.returncode == 0, f"Build should succeed. Error: {result.stderr}"
    
    def test_typescript_check(self):
        """Test TypeScript compilation"""
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        
        # Filter out backup file errors
        if result.returncode != 0:
            lines = result.stdout.split('\\n')
            error_lines = [line for line in lines if 'backups/' not in line and 'error TS' in line]
            
            assert len(error_lines) == 0, f"TypeScript should compile without errors. Errors: {error_lines}"
''')
        test_files.append(str(integration_test_file))
        
        return test_files

    def _create_deployment_tests(self, test_dir: Path) -> List[str]:
        """Create deployment phase tests"""
        test_files = []
        
        deployment_test_file = test_dir / "test_deployment.py"
        with open(deployment_test_file, 'w') as f:
            f.write('''
"""
Deployment Phase Tests
"""
import pytest
import requests
from pathlib import Path

class TestDeployment:
    """Test deployment readiness"""
    
    def test_environment_config(self):
        """Test that environment configuration is complete"""
        env_example = Path(".env.example")
        assert env_example.exists(), "Environment example should exist"
        
        # Check for required environment variables
        content = env_example.read_text()
        required_vars = [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY"
        ]
        
        for var in required_vars:
            assert var in content, f"Environment should include {var}"
    
    def test_package_json_valid(self):
        """Test that package.json is valid"""
        package_json = Path("package.json")
        assert package_json.exists(), "package.json should exist"
        
        import json
        with open(package_json, 'r') as f:
            data = json.load(f)
        
        assert "scripts" in data, "package.json should have scripts"
        assert "build" in data["scripts"], "Should have build script"
        assert "start" in data["scripts"], "Should have start script"
    
    def test_docker_ready(self):
        """Test that Docker configuration is ready"""
        dockerfile_test = Path("Dockerfile.test")
        assert dockerfile_test.exists(), "Dockerfile.test should exist"
''')
        test_files.append(str(deployment_test_file))
        
        return test_files

    def _generate_docker_test_config(self):
        """Generate Docker test configuration"""
        dockerfile_content = '''
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    git \\
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (needed for npm commands in tests)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \\
    && apt-get install -y nodejs

# Copy Python requirements
COPY ai-agent-framework/requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copy test files
COPY tests/ /app/tests/
COPY src/ /app/src/
COPY package.json /app/package.json
COPY tsconfig.json /app/tsconfig.json
COPY *.md /app/

# Set environment variables
ENV PYTHONPATH=/app
ENV NODE_ENV=test

# Run tests
CMD ["python", "-m", "pytest", "-v", "/app/tests/"]
'''
        
        dockerfile_path = self.project_path / "Dockerfile.test"
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile_content)
        
        # Create requirements.txt for Python dependencies
        requirements_content = '''
pydantic==2.5.0
pytest==7.4.0
docker==7.0.0
rich==13.7.0
requests==2.31.0
'''
        
        requirements_path = self.project_path / "ai-agent-framework" / "requirements.txt"
        requirements_path.parent.mkdir(exist_ok=True)
        with open(requirements_path, 'w') as f:
            f.write(requirements_content)

    def run_docker_tests(self) -> AgentResponse:
        """
        Run tests in Docker container for validation
        """
        if not self.docker_client:
            return AgentResponse(
                success=False,
                message="❌ Docker client not available",
                phase=self.state.current_phase,
                next_actions=["Install and start Docker", "Check Docker daemon status"]
            )
        
        logger.info(f"🐳 Running Docker tests for phase: {self.state.current_phase}")
        
        try:
            # Build test image
            logger.info("📦 Building test Docker image...")
            image, build_logs = self.docker_client.images.build(
                path=str(self.project_path),
                dockerfile="Dockerfile.test",
                tag=f"agent-tests:{self.state.current_phase}",
                rm=True
            )
            
            # Run tests in container
            logger.info("🏃 Running tests in Docker container...")
            container = self.docker_client.containers.run(
                image.id,
                command="python -m pytest -v --tb=short",
                volumes={str(self.project_path): {'bind': '/app', 'mode': 'rw'}},
                environment={'PYTHONPATH': '/app'},
                remove=True,
                stdout=True,
                stderr=True
            )
            
            # Parse test results
            test_output = container.decode('utf-8')
            test_results = self._parse_pytest_output(test_output)
            
            # Update state with test results
            self.state.test_results.extend(test_results)
            
            # Check if all tests passed
            failed_tests = [r for r in test_results if r.status == "failed"]
            
            if failed_tests:
                self.state.phase_status = PhaseStatus.FAILED
                message = f"❌ {len(failed_tests)} tests failed"
                success = False
            else:
                self.state.phase_status = PhaseStatus.TESTING
                message = f"✅ All {len(test_results)} tests passed"
                success = True
            
            self.state.last_update = datetime.now()
            self._save_state()
            
            # Display results
            self._display_test_results(test_results)
            
            return AgentResponse(
                success=success,
                message=message,
                phase=self.state.current_phase,
                data={
                    "total_tests": len(test_results),
                    "passed_tests": len([r for r in test_results if r.status == "passed"]),
                    "failed_tests": len(failed_tests),
                    "test_output": test_output
                },
                next_actions=["Review test results", "Fix failing tests if any", "Request approval for phase completion"]
            )
            
        except Exception as e:
            logger.error(f"❌ Docker test execution failed: {e}")
            return AgentResponse(
                success=False,
                message=f"❌ Docker test execution failed: {str(e)}",
                phase=self.state.current_phase,
                next_actions=["Check Docker configuration", "Review test setup", "Check Dockerfile.test"]
            )

    def _parse_pytest_output(self, output: str) -> List[TestResult]:
        """Parse pytest output to extract test results"""
        test_results = []
        lines = output.split('\n')
        
        for line in lines:
            if '::' in line and ('PASSED' in line or 'FAILED' in line or 'SKIPPED' in line):
                parts = line.split()
                if len(parts) >= 2:
                    test_name = parts[0].split('::')[-1]
                    status = parts[1].lower()
                    
                    test_result = TestResult(
                        test_name=test_name,
                        status=status,
                        duration=0.0,  # Would need to parse timing info
                        stdout=line
                    )
                    test_results.append(test_result)
        
        return test_results

    def _display_test_results(self, test_results: List[TestResult]):
        """Display test results in a formatted table"""
        table = Table(title="🧪 Test Results")
        table.add_column("Test Name", style="cyan")
        table.add_column("Status", style="bold")
        table.add_column("Duration", style="magenta")
        
        for result in test_results:
            status_color = "green" if result.status == "passed" else "red" if result.status == "failed" else "yellow"
            table.add_row(
                result.test_name,
                f"[{status_color}]{result.status.upper()}[/{status_color}]",
                f"{result.duration:.2f}s"
            )
        
        console.print(table)

    def report_status(self) -> AgentResponse:
        """
        Generate comprehensive status report
        """
        logger.info("📊 Generating status report...")
        
        # Calculate progress metrics
        total_phases = len(self.config['phases'])
        completed_phases = len(self.state.completed_phases)
        progress_percentage = (completed_phases / total_phases) * 100 if total_phases > 0 else 0
        
        # Test statistics
        total_tests = len(self.state.test_results)
        passed_tests = len([r for r in self.state.test_results if r.status == "passed"])
        failed_tests = len([r for r in self.state.test_results if r.status == "failed"])
        
        # Display status panel
        status_panel = Panel(
            f"[bold green]Agent Status Report[/bold green]\n"
            f"[yellow]Current Phase:[/yellow] {self.state.current_phase or 'None'}\n"
            f"[yellow]Phase Status:[/yellow] {self.state.phase_status.value}\n"
            f"[yellow]Progress:[/yellow] {completed_phases}/{total_phases} phases ({progress_percentage:.1f}%)\n"
            f"[yellow]Tests:[/yellow] {passed_tests}/{total_tests} passed ({failed_tests} failed)\n"
            f"[yellow]Last Update:[/yellow] {self.state.last_update.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"[yellow]Roadmap Version:[/yellow] {self.state.roadmap_version}",
            title="📊 Project Status",
            border_style="blue"
        )
        console.print(status_panel)
        
        # Display roadmap progress
        self._display_roadmap_progress()
        
        return AgentResponse(
            success=True,
            message="✅ Status report generated successfully",
            phase=self.state.current_phase,
            data={
                "progress_percentage": progress_percentage,
                "completed_phases": completed_phases,
                "total_phases": total_phases,
                "test_statistics": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests
                },
                "current_phase": self.state.current_phase,
                "phase_status": self.state.phase_status.value
            },
            next_actions=self._get_next_actions()
        )

    def _display_roadmap_progress(self):
        """Display roadmap progress table"""
        table = Table(title="🗺️ Roadmap Progress")
        table.add_column("ID", style="cyan")
        table.add_column("Title", style="bold")
        table.add_column("Status", style="bold")
        table.add_column("Priority", style="magenta")
        table.add_column("Hours", style="yellow")
        
        for item in self.roadmap:
            status_color = {
                PhaseStatus.COMPLETE: "green",
                PhaseStatus.IN_PROGRESS: "yellow",
                PhaseStatus.TESTING: "blue",
                PhaseStatus.FAILED: "red",
                PhaseStatus.PENDING: "white"
            }.get(item.status, "white")
            
            table.add_row(
                item.id,
                item.title[:40] + "..." if len(item.title) > 40 else item.title,
                f"[{status_color}]{item.status.value.upper()}[/{status_color}]",
                str(item.priority),
                str(item.estimated_hours)
            )
        
        console.print(table)

    def _get_next_actions(self) -> List[str]:
        """Get suggested next actions based on current state"""
        next_actions = []
        
        if not self.state.current_phase:
            next_actions.append("Initialize a phase with init_phase()")
            return next_actions
        
        if self.state.phase_status == PhaseStatus.PENDING:
            next_actions.append("Generate tests with generate_tests()")
        elif self.state.phase_status == PhaseStatus.IN_PROGRESS:
            next_actions.append("Run Docker tests with run_docker_tests()")
        elif self.state.phase_status == PhaseStatus.TESTING:
            next_actions.append("Request approval for phase completion")
        elif self.state.phase_status == PhaseStatus.FAILED:
            next_actions.append("Fix failing tests and re-run run_docker_tests()")
        elif self.state.phase_status == PhaseStatus.COMPLETE:
            # Find next pending phase
            next_phase = self._find_next_phase()
            if next_phase:
                next_actions.append(f"Initialize next phase: {next_phase}")
            else:
                next_actions.append("All phases complete! Ready for deployment")
        
        return next_actions

    def _find_next_phase(self) -> Optional[str]:
        """Find the next phase that can be started"""
        for phase_config in self.config['phases']:
            phase_name = phase_config['name']
            
            # Skip if already completed
            if phase_name in self.state.completed_phases:
                continue
            
            # Check if dependencies are met
            dependencies = phase_config.get('dependencies', [])
            if all(dep in self.state.completed_phases for dep in dependencies):
                return phase_name
        
        return None

    def update_roadmap(self, updates: List[Dict[str, Any]]) -> AgentResponse:
        """
        Update project roadmap with new items or modifications
        """
        logger.info(f"🗺️ Updating roadmap with {len(updates)} changes...")
        
        updated_items = []
        
        for update in updates:
            item_id = update.get('id')
            if not item_id:
                logger.warning("⚠️ Skipping update without ID")
                continue
            
            # Find existing item or create new one
            existing_item = next((item for item in self.roadmap if item.id == item_id), None)
            
            if existing_item:
                # Update existing item
                for field, value in update.items():
                    if hasattr(existing_item, field):
                        setattr(existing_item, field, value)
                existing_item.updated_at = datetime.now()
                updated_items.append(existing_item)
            else:
                # Create new item
                new_item_data = {
                    'id': item_id,
                    'title': update.get('title', 'New Item'),
                    'description': update.get('description', ''),
                    'status': PhaseStatus.PENDING,
                    'priority': update.get('priority', 3),
                    'estimated_hours': update.get('estimated_hours', 1),
                    'dependencies': update.get('dependencies', []),
                    'tags': update.get('tags', []),
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }
                new_item = RoadmapItem(**new_item_data)
                self.roadmap.append(new_item)
                updated_items.append(new_item)
        
        # Save updated roadmap
        self._save_roadmap(self.roadmap)
        
        # Display updated roadmap
        self._display_roadmap_progress()
        
        return AgentResponse(
            success=True,
            message=f"✅ Updated {len(updated_items)} roadmap items",
            data={
                "updated_items": [item.id for item in updated_items],
                "total_items": len(self.roadmap)
            },
            next_actions=["Review updated roadmap", "Continue with current phase"]
        )

    def complete_phase(self, phase_name: str) -> AgentResponse:
        """
        Mark a phase as complete after approval
        """
        if phase_name != self.state.current_phase:
            return AgentResponse(
                success=False,
                message=f"❌ Cannot complete phase '{phase_name}'. Current phase is '{self.state.current_phase}'",
                phase=self.state.current_phase
            )
        
        if self.state.phase_status != PhaseStatus.TESTING:
            return AgentResponse(
                success=False,
                message=f"❌ Phase '{phase_name}' is not ready for completion. Status: {self.state.phase_status.value}",
                phase=self.state.current_phase,
                next_actions=["Run and pass all tests first"]
            )
        
        # Mark phase as complete
        self.state.completed_phases.append(phase_name)
        self.state.phase_status = PhaseStatus.COMPLETE
        self.state.current_phase = None
        self.state.last_update = datetime.now()
        self._save_state()
        
        # Update roadmap
        for item in self.roadmap:
            if item.id.endswith(phase_name.replace("_", "-")):
                item.status = PhaseStatus.COMPLETE
                item.updated_at = datetime.now()
        self._save_roadmap(self.roadmap)
        
        # Display completion message
        completion_panel = Panel(
            f"[bold green]Phase Completed! 🎉[/bold green]\n"
            f"[yellow]Phase:[/yellow] {phase_name}\n"
            f"[yellow]Completed Phases:[/yellow] {len(self.state.completed_phases)}\n"
            f"[yellow]Next Phase:[/yellow] {self._find_next_phase() or 'All phases complete!'}",
            title="✅ Phase Complete",
            border_style="green"
        )
        console.print(completion_panel)
        
        return AgentResponse(
            success=True,
            message=f"✅ Phase '{phase_name}' completed successfully!",
            data={
                "completed_phase": phase_name,
                "total_completed": len(self.state.completed_phases),
                "next_phase": self._find_next_phase()
            },
            next_actions=self._get_next_actions()
        )


# Command-line interface for the agent
if __name__ == "__main__":
    import sys
    
    agent = PydanticAgent()
    
    if len(sys.argv) < 2:
        console.print("[red]Usage: python pydantic_agent_core.py <command> [args][/red]")
        console.print("Commands:")
        console.print("  init_phase <phase_name>")
        console.print("  generate_tests [test_type]")
        console.print("  run_docker_tests")
        console.print("  report_status")
        console.print("  update_roadmap")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "init_phase":
        if len(sys.argv) < 3:
            console.print("[red]Error: phase_name required[/red]")
            sys.exit(1)
        phase_name = sys.argv[2]
        response = agent.init_phase(phase_name)
    elif command == "generate_tests":
        test_type = sys.argv[2] if len(sys.argv) > 2 else "unit"
        response = agent.generate_tests(test_type)
    elif command == "run_docker_tests":
        response = agent.run_docker_tests()
    elif command == "report_status":
        response = agent.report_status()
    elif command == "update_roadmap":
        # For CLI, just display current roadmap
        response = agent.report_status()
    else:
        console.print(f"[red]Unknown command: {command}[/red]")
        sys.exit(1)
    
    # Display response
    status_color = "green" if response.success else "red"
    console.print(f"[{status_color}]{response.message}[/{status_color}]")
    
    if response.next_actions:
        console.print("\n[yellow]Next Actions:[/yellow]")
        for action in response.next_actions:
            console.print(f"  • {action}")
