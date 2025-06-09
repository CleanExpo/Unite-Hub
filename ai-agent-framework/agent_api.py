#!/usr/bin/env python3

"""
🚀 FASTAPI API WRAPPER FOR PYDANTIC AGENT FRAMEWORK

This module provides a REST API interface for the Pydantic Agent Framework,
enabling HTTP-based interaction with production-grade AI agents.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from pydantic_agent_core import (
    ProductionAgentFramework,
    AgentConfig,
    AgentTask,
    AgentResponse,
    AgentCapability,
    Priority,
    AgentStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global framework instance
framework: Optional[ProductionAgentFramework] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    global framework
    
    # Startup
    logger.info("🚀 Starting Pydantic Agent Framework API")
    framework = ProductionAgentFramework()
    
    # Create default agent
    default_config = AgentConfig(
        name="DefaultProductionAgent",
        description="Default agent for general tasks",
        capabilities=[
            AgentCapability.TEXT_GENERATION,
            AgentCapability.REASONING,
            AgentCapability.PLANNING,
            AgentCapability.TOOL_USE
        ]
    )
    framework.create_agent(default_config)
    
    logger.info("✅ Pydantic Agent Framework API started successfully")
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Pydantic Agent Framework API")

# Create FastAPI app
app = FastAPI(
    title="Pydantic Agent Framework API",
    description="Production-grade AI agent framework with structured outputs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class CreateAgentRequest(BaseModel):
    """Request model for creating a new agent"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    capabilities: List[AgentCapability] = Field(default_factory=list)
    max_iterations: int = Field(default=10, ge=1, le=100)
    timeout_seconds: int = Field(default=300, ge=1, le=3600)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=32768)
    model_name: str = Field(default="gpt-4")

class ExecuteTaskRequest(BaseModel):
    """Request model for executing a task"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    priority: Priority = Field(default=Priority.MEDIUM)
    input_data: Dict[str, Any] = Field(default_factory=dict)
    expected_output_schema: Optional[Dict[str, Any]] = Field(default=None)
    constraints: List[str] = Field(default_factory=list)
    timeout_seconds: Optional[int] = Field(default=None)
    agent_id: Optional[str] = Field(default=None)

class TaskStatusResponse(BaseModel):
    """Response model for task status"""
    task_id: str
    status: AgentStatus
    agent_id: str
    created_at: datetime
    execution_time_seconds: float
    confidence_score: float

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    timestamp: datetime
    framework_health: Dict[str, Any]
    version: str = "1.0.0"

# API Dependencies
async def get_framework() -> ProductionAgentFramework:
    """Dependency to get the framework instance"""
    if framework is None:
        raise HTTPException(status_code=503, detail="Framework not initialized")
    return framework

# API Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check(bg_tasks: BackgroundTasks):
    """Health check endpoint"""
    try:
        fw = await get_framework()
        health_status = fw.get_health_status()
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            framework_health=health_status
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            framework_health={"error": str(e)}
        )

@app.post("/agents")
async def create_agent(
    request: CreateAgentRequest,
    fw: ProductionAgentFramework = Depends(get_framework)
):
    """Create a new agent"""
    try:
        config = AgentConfig(
            name=request.name,
            description=request.description,
            capabilities=request.capabilities,
            max_iterations=request.max_iterations,
            timeout_seconds=request.timeout_seconds,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            model_name=request.model_name
        )
        
        agent = fw.create_agent(config)
        
        return {
            "agent_id": agent.config.agent_id,
            "name": agent.config.name,
            "status": "created",
            "capabilities": agent.config.capabilities
        }
    except Exception as e:
        logger.error(f"Failed to create agent: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/agents")
async def list_agents(fw: ProductionAgentFramework = Depends(get_framework)):
    """List all registered agents"""
    try:
        agents = []
        for agent_id, agent in fw.orchestrator.agents.items():
            agents.append({
                "agent_id": agent_id,
                "name": agent.config.name,
                "description": agent.config.description,
                "status": agent.status,
                "capabilities": agent.config.capabilities
            })
        
        return {"agents": agents, "total": len(agents)}
    except Exception as e:
        logger.error(f"Failed to list agents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/execute")
async def execute_task(
    request: ExecuteTaskRequest,
    fw: ProductionAgentFramework = Depends(get_framework)
):
    """Execute a task using the agent framework"""
    try:
        task = AgentTask(
            name=request.name,
            description=request.description,
            priority=request.priority,
            input_data=request.input_data,
            expected_output_schema=request.expected_output_schema,
            constraints=request.constraints,
            timeout_seconds=request.timeout_seconds
        )
        
        response = await fw.execute_single_task(task)
        
        return {
            "task_id": response.task_id,
            "agent_id": response.agent_id,
            "status": response.status,
            "result": response.result,
            "reasoning": response.reasoning,
            "confidence_score": response.confidence_score,
            "execution_time_seconds": response.execution_time_seconds,
            "iterations_used": response.iterations_used,
            "errors": response.errors,
            "warnings": response.warnings,
            "metadata": response.metadata,
            "created_at": response.created_at
        }
    except Exception as e:
        logger.error(f"Failed to execute task: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/tasks/batch")
async def execute_batch_tasks(
    requests: List[ExecuteTaskRequest],
    fw: ProductionAgentFramework = Depends(get_framework)
):
    """Execute multiple tasks in batch"""
    try:
        tasks = []
        for request in requests:
            task = AgentTask(
                name=request.name,
                description=request.description,
                priority=request.priority,
                input_data=request.input_data,
                expected_output_schema=request.expected_output_schema,
                constraints=request.constraints,
                timeout_seconds=request.timeout_seconds
            )
            tasks.append(task)
        
        responses = await fw.execute_workflow(tasks)
        
        return {
            "batch_id": f"batch_{datetime.utcnow().timestamp()}",
            "total_tasks": len(tasks),
            "results": [
                {
                    "task_id": r.task_id,
                    "status": r.status,
                    "execution_time_seconds": r.execution_time_seconds,
                    "confidence_score": r.confidence_score
                }
                for r in responses
            ]
        }
    except Exception as e:
        logger.error(f"Failed to execute batch tasks: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/{task_id}")
async def get_task_result(
    task_id: str,
    fw: ProductionAgentFramework = Depends(get_framework)
):
    """Get the result of a specific task"""
    try:
        # Find task in completed tasks
        for response in fw.orchestrator.completed_tasks:
            if response.task_id == task_id:
                return {
                    "task_id": response.task_id,
                    "agent_id": response.agent_id,
                    "status": response.status,
                    "result": response.result,
                    "execution_time_seconds": response.execution_time_seconds,
                    "confidence_score": response.confidence_score,
                    "created_at": response.created_at
                }
        
        # Check active tasks
        if task_id in fw.orchestrator.active_tasks:
            return {
                "task_id": task_id,
                "status": "running",
                "message": "Task is currently being executed"
            }
        
        raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task result: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics(fw: ProductionAgentFramework = Depends(get_framework)):
    """Get framework metrics"""
    try:
        return fw.get_health_status()
    except Exception as e:
        logger.error(f"Failed to get metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/system/health-check")
async def comprehensive_health_check(fw: ProductionAgentFramework = Depends(get_framework)):
    """Run comprehensive system health check"""
    try:
        health_result = await fw.run_health_check()
        return health_result
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "agent_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
