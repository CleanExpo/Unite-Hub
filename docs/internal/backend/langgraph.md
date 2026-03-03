# LangGraph Documentation

> Official documentation sourced from [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)

## Overview

LangGraph is a low-level orchestration framework for building, managing, and deploying long-running, stateful agents. Trusted by companies like Klarna, Replit, Elastic, and more.

## Core Benefits

- **Durable execution**: Build agents that persist through failures and can run for extended periods, automatically resuming from exactly where they left off
- **Human-in-the-loop**: Seamlessly incorporate human oversight by inspecting and modifying agent state at any point during execution
- **Comprehensive memory**: Create truly stateful agents with both short-term working memory and long-term persistent memory across sessions
- **Debugging with LangSmith**: Gain deep visibility into complex agent behavior with visualization tools that trace execution paths and capture state transitions
- **Production-ready deployment**: Deploy sophisticated agent systems confidently with scalable infrastructure

## Installation

```bash
pip install -U langgraph
```

## Quick Start with Prebuilt Agent

```python
from langgraph.prebuilt import create_react_agent

def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

agent = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",
    tools=[get_weather],
    prompt="You are a helpful assistant"
)

# Run the agent
result = agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather in sf"}]}
)
```

## Basic StateGraph

```python
from langgraph.graph import StateGraph, MessagesState, START, END

def mock_llm(state: MessagesState):
    return {"messages": [{"role": "ai", "content": "hello world"}]}

graph = StateGraph(MessagesState)
graph.add_node(mock_llm)
graph.add_edge(START, "mock_llm")
graph.add_edge("mock_llm", END)
graph = graph.compile()

result = graph.invoke({"messages": [{"role": "user", "content": "hi!"}]})
```

## Agent with Tools

```python
from langgraph.graph import MessagesState
from langchain.messages import SystemMessage, HumanMessage, ToolMessage
from langchain.tools import tool

@tool
def multiply(a: int, b: int) -> int:
    """Multiply a and b."""
    return a * b

@tool
def add(a: int, b: int) -> int:
    """Adds a and b."""
    return a + b

tools = [add, multiply]
tools_by_name = {tool.name: tool for tool in tools}
llm_with_tools = llm.bind_tools(tools)

def llm_call(state: MessagesState):
    """LLM decides whether to call a tool or not"""
    return {
        "messages": [
            llm_with_tools.invoke(
                [SystemMessage(content="You are a helpful assistant.")]
                + state["messages"]
            )
        ]
    }

def tool_node(state: dict):
    """Performs the tool call"""
    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}

def should_continue(state: MessagesState):
    """Decide if we should continue or stop"""
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tool_node"
    return END
```

## Building the Workflow

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# Build workflow
agent_builder = StateGraph(MessagesState)

# Add nodes
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# Add edges
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    ["tool_node", END]
)
agent_builder.add_edge("tool_node", "llm_call")

# Compile the agent
agent = agent_builder.compile(checkpointer=MemorySaver())

# Invoke
messages = [HumanMessage(content="Add 3 and 4.")]
result = agent.invoke({"messages": messages})
```

## Multi-Agent Supervisor

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import Literal

class AgentState(MessagesState):
    next: str

def research_node(state: AgentState):
    # Research agent logic
    return {"messages": [...]}

def coder_node(state: AgentState):
    # Coder agent logic
    return {"messages": [...]}

def supervisor_agent(state: AgentState):
    # Supervisor decides which agent to call
    response = model.invoke(...)
    return {"next": response["next_agent"]}

members = ["Researcher", "Coder"]

# Create graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("Researcher", research_node)
workflow.add_node("Coder", coder_node)
workflow.add_node("Supervisor", supervisor_agent)

# Add edges from members to Supervisor
for member in members:
    workflow.add_edge(member, "Supervisor")

# Add conditional edges
conditional_map = {k: k for k in members}
conditional_map["FINISH"] = END

workflow.add_conditional_edges(
    "Supervisor",
    lambda state: state["next"],
    conditional_map
)

workflow.add_edge(START, "Supervisor")

# Compile
graph = workflow.compile(checkpointer=MemorySaver())
```

## Hierarchical Multi-Agent

```python
from typing import Literal
from langgraph.graph import StateGraph, MessagesState, START

# Team 1 definition
class Team1State(MessagesState):
    next: Literal["team_1_agent_1", "team_1_agent_2", "__end__"]

def team_1_supervisor(state: Team1State):
    response = model.invoke(...)
    return {"next": response["next_agent"]}

team_1_builder = StateGraph(Team1State)
team_1_builder.add_node(team_1_supervisor)
team_1_builder.add_node(team_1_agent_1)
team_1_builder.add_node(team_1_agent_2)
team_1_builder.add_edge(START, "team_1_supervisor")
team_1_builder.add_conditional_edges("team_1_supervisor", lambda state: state["next"])
team_1_graph = team_1_builder.compile()

# Top-level supervisor
class TopLevelState(MessagesState):
    next: Literal["team_1", "team_2", "__end__"]

def top_level_supervisor(state: TopLevelState):
    response = model.invoke(...)
    return {"next": response["next_team"]}

builder = StateGraph(TopLevelState)
builder.add_node(top_level_supervisor)
builder.add_node(team_1_graph)
builder.add_node(team_2_graph)
builder.add_edge(START, "top_level_supervisor")
builder.add_conditional_edges("top_level_supervisor", lambda state: state["next"])

graph = builder.compile()
```

## Plan and Execute Pattern

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class PlanExecute(TypedDict):
    input: str
    plan: List[str]
    past_steps: List[Tuple[str, str]]
    response: str

workflow = StateGraph(PlanExecute)

workflow.add_node("planner", plan_step)
workflow.add_node("execute", execute_step)
workflow.add_node("replan", replan_step)
workflow.add_node("final_report", generate_final_report)

workflow.add_edge(START, "planner")
workflow.add_edge("planner", "execute")
workflow.add_edge("execute", "replan")
workflow.add_edge("final_report", END)

workflow.add_conditional_edges(
    "replan",
    should_end,
    {"execute": "execute", "final_report": "final_report"},
)

app = workflow.compile(checkpointer=MemorySaver())
```

## Human-in-the-Loop

```python
from langgraph.types import Command

config = {"configurable": {"thread_id": "1"}}

# Run until human review
result = app.invoke(initial_state, config)
# Graph pauses at human_review node

# Resume with human input
human_response = Command(
    resume={
        "approved": True,
        "edited_response": "Updated response..."
    }
)
final_result = app.invoke(human_response, config)
```

## Prebuilt Agents

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI()
tools = [search_tool, calculator_tool]

graph = create_react_agent(model, tools)
result = graph.invoke({"messages": [{"role": "user", "content": "What's 2+2?"}]})
```

## CLI Commands

```bash
# Install
pip install langgraph-cli

# Create new project
langgraph new my-agent

# Run development server
langgraph dev

# Deploy
langgraph up
```

## LangGraph Ecosystem

- **LangSmith**: Agent evals and observability, debug poor-performing runs
- **LangSmith Deployment**: Deploy and scale agents with purpose-built platform
- **LangGraph Studio**: Visual prototyping and iteration
- **LangChain**: Integrations and composable components

## Official Resources

- **Documentation**: [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)
- **Guides**: [langchain-ai.github.io/langgraph/guides](https://langchain-ai.github.io/langgraph/guides/)
- **Multi-Agent**: [langchain-ai.github.io/langgraph/agents/multi-agent](https://langchain-ai.github.io/langgraph/agents/multi-agent/)
- **LangChain Academy**: [academy.langchain.com](https://academy.langchain.com/courses/intro-to-langgraph)
- **GitHub (Python)**: [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
- **GitHub (JS)**: [github.com/langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs)
